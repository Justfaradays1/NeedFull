// WHAT: Manual bank transfer service for admin-verified deposits
// WHY: Handle off-chain bank transfers with admin verification before crediting wallet
// FUTURE: Add auto-verification with bank API integration, add webhook support from payment processors

import db, { queryOne, withTransaction } from "../config/db";
import { creditWallet } from "./wallet.service";
import { notifyUser, notifyMany } from "./notification.service";
import {
  sendManualTransferReceived,
  sendTransferConfirmed,
} from "./email.service";
import { v4 as uuidv4 } from "uuid";

// WHAT: Manual transfer record structure
interface ManualTransfer {
  id: string;
  user_id: string;
  amount_kobo: number;
  amount_naira: number;
  bank_reference: string; // User's bank transaction reference
  sender_bank: string; // Bank user transferred from
  sender_name: string; // Name on sending account
  receipt_url?: string; // Proof of transfer (screenshot/receipt)
  status: "pending" | "confirmed" | "rejected"; // Transfer status
  wallet_tx_id?: string; // Link to wallet transaction after confirmation
  reviewed_by?: string; // Admin who reviewed
  reviewed_at?: string; // Timestamp of review
  rejection_reason?: string; // Why transfer was rejected
  created_at: string;
  updated_at: string;
}

// WHAT: Get list of admin user IDs for notifications
// WHY: Notify all admins of pending transfers for quick review
async function getAdminUserIds(): Promise<string[]> {
  try {
    const result = await db.query<{ id: string }>(
      `SELECT id FROM users WHERE role = 'admin'`,
    );
    return result.rows.map((row) => row.id);
  } catch (error) {
    console.error("[ManualTransfer] Failed to get admin IDs:", error);
    return [];
  }
}

// WHAT: Submit manual bank transfer for admin verification
// WHY: Create transfer record, prevent duplicates, notify admins for review
export async function submitManualTransfer(
  userId: string,
  params: {
    amountNaira: number;
    bankReference: string;
    senderBank: string;
    senderName: string;
    receiptUrl?: string;
  },
): Promise<ManualTransfer> {
  try {
    // WHAT: Convert Naira to Kobo
    // WHY: All wallet amounts stored in kobo (integers)
    const amountKobo = Math.floor(params.amountNaira * 100);

    if (amountKobo <= 0) {
      throw new Error("Amount must be greater than ₦0");
    }

    // WHAT: Check for duplicate bank reference
    // WHY: Prevent accidental duplicate submissions or duplicate confirmations
    const existing = await db.query<{ id: string }>(
      `SELECT id FROM manual_transfers 
       WHERE bank_reference = $1 AND status != 'rejected'
       LIMIT 1`,
      [params.bankReference],
    );

    if (existing.rows.length > 0) {
      throw new Error(
        `A transfer with bank reference ${params.bankReference} is already pending or confirmed`,
      );
    }

    // WHAT: Create manual transfer record
    // WHY: Establish audit trail and pending state for admin review
    const transferId = uuidv4();
    const now = new Date().toISOString();

    const transfer = await queryOne<ManualTransfer>(
      `INSERT INTO manual_transfers 
       (id, user_id, amount_kobo, amount_naira, bank_reference, sender_bank, sender_name, 
        receipt_url, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)
       RETURNING id, user_id, amount_kobo, amount_naira, bank_reference, sender_bank, sender_name,
                 receipt_url, status, wallet_tx_id, reviewed_by, reviewed_at, rejection_reason,
                 created_at, updated_at`,
      [
        transferId,
        userId,
        amountKobo,
        params.amountNaira,
        params.bankReference,
        params.senderBank,
        params.senderName,
        params.receiptUrl || null,
        "pending",
        now,
      ],
    );

    // WHAT: Notify all admins about new pending transfer
    // WHY: Admins can review and confirm/reject in timely manner
    const adminIds = await getAdminUserIds();
    if (adminIds.length > 0) {
      await notifyMany(adminIds, {
        type: "manual_transfer_pending",
        title: "Manual Transfer Received",
        body: `New manual transfer of ₦${params.amountNaira.toLocaleString()} from ${params.senderBank} needs verification`,
        taskId: undefined,
        conversationId: undefined,
        actorId: userId,
      });
    }

    // WHAT: Send user email confirming receipt
    // WHY: User knows transfer was registered and is being verified
    const user = await queryOne<{ full_name: string; email: string }>(
      `SELECT full_name, email FROM users WHERE id = $1`,
      [userId],
    );

    if (user) {
      await sendManualTransferReceived(
        user.email,
        user.full_name,
        params.amountNaira,
      );
    }

    // WHAT: Return created transfer record
    return transfer;
  } catch (error) {
    throw new Error(
      `Failed to submit manual transfer: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

// WHAT: Admin confirms manual transfer and credits wallet
// WHY: Verify transfer receipt and release funds to user's wallet
export async function confirmManualTransfer(
  transferId: string,
  adminUserId: string,
): Promise<{
  transfer: ManualTransfer;
  balanceKobo: number;
  balanceNaira: number;
}> {
  try {
    // WHAT: Fetch transfer record
    // WHY: Validate status is pending before proceeding
    const transfer = await queryOne<ManualTransfer>(
      `SELECT id, user_id, amount_kobo, amount_naira, bank_reference, sender_bank, sender_name,
              receipt_url, status, wallet_tx_id, reviewed_by, reviewed_at, rejection_reason,
              created_at, updated_at
       FROM manual_transfers WHERE id = $1`,
      [transferId],
    );

    if (transfer.status !== "pending") {
      throw new Error(
        `Transfer status is ${transfer.status}, expected pending. Cannot confirm.`,
      );
    }

    // WHAT: Use transaction to ensure atomicity
    // WHY: Both wallet credit and transfer status update must succeed together
    const result = await withTransaction(async (client) => {
      // WHAT: Credit wallet using idempotency key
      // WHY: Prevent double-crediting if confirm is retried
      const wallet = await creditWallet(
        client,
        transfer.user_id,
        transfer.amount_kobo,
        "manual_deposit_confirmed",
        "Manual bank transfer confirmed",
        `manual_${transferId}`, // idempotencyKey
      );

      // WHAT: Update transfer record with confirmation details
      // WHY: Record which admin confirmed, when, and link to wallet transaction
      const now = new Date().toISOString();
      const updated = await client.query<ManualTransfer>(
        `UPDATE manual_transfers 
         SET status = $1, reviewed_by = $2, reviewed_at = $3, wallet_tx_id = $4, updated_at = $5
         WHERE id = $6
         RETURNING id, user_id, amount_kobo, amount_naira, bank_reference, sender_bank, sender_name,
                   receipt_url, status, wallet_tx_id, reviewed_by, reviewed_at, rejection_reason,
                   created_at, updated_at`,
        [
          "confirmed",
          adminUserId,
          now,
          wallet.id, // wallet.id is the wallet transaction ID (from wallet_transactions table)
          now,
          transferId,
        ],
      );

      return {
        transfer: updated.rows[0],
        wallet,
      };
    });

    // WHAT: Notify user and admins of confirmation
    // WHY: User needs to know funds are available, admins for audit
    await notifyUser(result.transfer.user_id, {
      type: "manual_transfer_confirmed",
      title: "Transfer Confirmed",
      body: `Your manual transfer of ₦${result.transfer.amount_naira.toLocaleString()} has been confirmed and added to your wallet`,
      taskId: undefined,
      conversationId: undefined,
      actorId: adminUserId,
    });

    // WHAT: Send user confirmation email
    // WHY: Email confirmation outside of app
    const user = await queryOne<{ full_name: string; email: string }>(
      `SELECT full_name, email FROM users WHERE id = $1`,
      [result.transfer.user_id],
    );

    if (user) {
      await sendTransferConfirmed(
        user.email,
        user.full_name,
        result.transfer.amount_naira,
        result.wallet.balance_kobo / 100, // new balance in Naira
      );
    }

    return {
      transfer: result.transfer,
      balanceKobo: result.wallet.balance_kobo,
      balanceNaira: result.wallet.balance_kobo / 100,
    };
  } catch (error) {
    throw new Error(
      `Failed to confirm manual transfer: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

// WHAT: Admin rejects manual transfer and notifies user
// WHY: Decline fraudulent or invalid transfers with reason
export async function rejectManualTransfer(
  transferId: string,
  adminUserId: string,
  reason: string,
): Promise<ManualTransfer> {
  try {
    if (!reason || reason.trim().length === 0) {
      throw new Error("Rejection reason is required");
    }

    // WHAT: Fetch transfer record
    // WHY: Verify exists and get user_id for notification
    const transfer = await queryOne<ManualTransfer>(
      `SELECT id, user_id, amount_kobo, amount_naira, bank_reference, sender_bank, sender_name,
              receipt_url, status, wallet_tx_id, reviewed_by, reviewed_at, rejection_reason,
              created_at, updated_at
       FROM manual_transfers WHERE id = $1`,
      [transferId],
    );

    if (transfer.status !== "pending") {
      throw new Error(
        `Transfer status is ${transfer.status}, expected pending. Cannot reject.`,
      );
    }

    // WHAT: Update transfer with rejection details
    // WHY: Record admin decision and reason for audit trail
    const now = new Date().toISOString();
    const updated = await queryOne<ManualTransfer>(
      `UPDATE manual_transfers 
       SET status = $1, rejection_reason = $2, reviewed_by = $3, reviewed_at = $4, updated_at = $5
       WHERE id = $6
       RETURNING id, user_id, amount_kobo, amount_naira, bank_reference, sender_bank, sender_name,
                 receipt_url, status, wallet_tx_id, reviewed_by, reviewed_at, rejection_reason,
                 created_at, updated_at`,
      ["rejected", reason, adminUserId, now, now, transferId],
    );

    // WHAT: Notify user of rejection
    // WHY: User needs to know transfer was declined
    await notifyUser(updated.user_id, {
      type: "manual_transfer_rejected",
      title: "Transfer Rejected",
      body: `Your manual transfer of ₦${updated.amount_naira.toLocaleString()} was not verified. Reason: ${reason}`,
      taskId: undefined,
      conversationId: undefined,
      actorId: adminUserId,
    });

    // WHAT: Send user rejection email
    // WHY: Email notification outside of app
    const user = await queryOne<{ full_name: string; email: string }>(
      `SELECT full_name, email FROM users WHERE id = $1`,
      [updated.user_id],
    );

    if (user) {
      // NOTE: No dedicated rejection email function; could send generic support email
      // await sendManualTransferRejected(user.email, user.full_name, updated.amount_naira, reason);
    }

    return updated;
  } catch (error) {
    throw new Error(
      `Failed to reject manual transfer: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

// WHAT: Get pending manual transfers for admin review
// WHY: Show admins queue of transfers awaiting verification
export async function getPendingTransfers(
  limit: number = 20,
  offset: number = 0,
): Promise<{ transfers: ManualTransfer[]; total: number }> {
  try {
    const transfers = await db.query<ManualTransfer>(
      `SELECT id, user_id, amount_kobo, amount_naira, bank_reference, sender_bank, sender_name,
              receipt_url, status, wallet_tx_id, reviewed_by, reviewed_at, rejection_reason,
              created_at, updated_at
       FROM manual_transfers 
       WHERE status = 'pending'
       ORDER BY created_at ASC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );

    const countResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM manual_transfers WHERE status = 'pending'`,
    );

    return {
      transfers: transfers.rows,
      total: parseInt(countResult.count, 10),
    };
  } catch (error) {
    throw new Error(
      `Failed to get pending transfers: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

// WHAT: Get user's transfer history
// WHY: Show user their past manual transfers and status
export async function getUserTransferHistory(
  userId: string,
  limit: number = 10,
): Promise<ManualTransfer[]> {
  try {
    const result = await db.query<ManualTransfer>(
      `SELECT id, user_id, amount_kobo, amount_naira, bank_reference, sender_bank, sender_name,
              receipt_url, status, wallet_tx_id, reviewed_by, reviewed_at, rejection_reason,
              created_at, updated_at
       FROM manual_transfers 
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit],
    );

    return result.rows;
  } catch (error) {
    throw new Error(
      `Failed to get transfer history: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
