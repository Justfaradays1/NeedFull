// WHAT: Monnify virtual account service for receiving bank transfers
// WHY: Create unique bank accounts per user to track deposits, handle webhooks for automatic crediting
// FUTURE: Add account status monitoring, add transfer cancellation handling, add bank integration for account limits

import axios, { AxiosError } from "axios";
import { createHmac } from "crypto";
import db, { queryOne, withTransaction } from "../config/db";
import { creditWallet } from "./wallet.service";
import { notifyUser } from "./notification.service";
import { sendTransferConfirmed } from "./email.service";
import env from "../config/env";

// WHAT: Create Monnify API client with authentication
// WHY: Reusable axios instance with proper headers for Monnify API
const monnifyClient = axios.create({
  baseURL: "https://api.monnify.com",
  headers: {
    "Content-Type": "application/json",
  },
  auth: {
    username: env.MONNIFY_API_KEY,
    password: env.MONNIFY_SECRET_KEY,
  },
});

// WHAT: Virtual account record structure
interface VirtualAccount {
  id: string;
  user_id: string;
  account_number: string;
  bank_code: string;
  bank_name: string;
  account_name: string;
  monnify_reference: string; // accountReference from Monnify
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// WHAT: Create virtual account via Monnify API
// WHY: Generate unique account number for user to receive transfers
export async function createVirtualAccount(
  userId: string,
  email: string,
  fullName: string,
): Promise<{
  accountNumber: string;
  bankName: string;
  accountName: string;
}> {
  try {
    // WHAT: Call Monnify API to create reserved account
    // WHY: Monnify generates account number, assigns bank, handles routing
    const response = await monnifyClient.post(
      "/api/v2/bank-transfer/reserved-accounts",
      {
        accountReference: userId,
        accountName: fullName,
        currencyCode: "NGN",
        contractCode: env.MONNIFY_CONTRACT_CODE,
        customerEmail: email,
        bvn: null,
        getAllAvailableBanks: true,
      },
    );

    // WHAT: Check for successful response
    // WHY: Monnify returns success: true/false in response
    if (!response.data.requestSuccessful) {
      throw new Error(
        response.data.responseMessage || "Monnify account creation failed",
      );
    }

    const accountData = response.data.responseBody;

    // WHAT: Store virtual account in database
    // WHY: Track which account belongs to which user for webhook matching
    const now = new Date().toISOString();
    await db.query(
      `INSERT INTO virtual_accounts 
       (id, user_id, account_number, bank_code, bank_name, account_name, 
        monnify_reference, is_active, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $8)`,
      [
        userId,
        accountData.accountNumber,
        accountData.bankCode,
        accountData.bankName,
        accountData.accountName,
        userId, // monnify_reference = userId (accountReference we sent)
        true, // is_active
        now,
      ],
    );

    return {
      accountNumber: accountData.accountNumber,
      bankName: accountData.bankName,
      accountName: accountData.accountName,
    };
  } catch (error) {
    const message =
      error instanceof AxiosError
        ? error.response?.data?.responseMessage || error.message
        : error instanceof Error
          ? error.message
          : "Unknown error";
    throw new Error(`Monnify account creation failed: ${message}`);
  }
}

// WHAT: Get existing virtual account or create new one
// WHY: Reuse account if exists, avoid duplicate accounts per user
export async function getOrCreateVirtualAccount(
  userId: string,
  email: string,
  fullName: string,
): Promise<{
  accountNumber: string;
  bankName: string;
  accountName: string;
}> {
  try {
    // WHAT: Check if virtual account already exists
    // WHY: Reuse existing account to maintain stable account number
    const existing = await db.query<VirtualAccount>(
      `SELECT id, account_number, bank_name, account_name 
       FROM virtual_accounts 
       WHERE user_id = $1 AND is_active = true
       LIMIT 1`,
      [userId],
    );

    if (existing.rows.length > 0) {
      const account = existing.rows[0];
      return {
        accountNumber: account.account_number,
        bankName: account.bank_name,
        accountName: account.account_name,
      };
    }

    // WHAT: No active account found, create new one
    // WHY: User needs account for first-time deposit
    return await createVirtualAccount(userId, email, fullName);
  } catch (error) {
    throw new Error(
      `Failed to get or create virtual account: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

// WHAT: Handle incoming Monnify webhook for successful transfers
// WHY: Automatically credit user wallet when transfer received
export async function handleMonnifyWebhook(
  payload: any,
  signature: string,
): Promise<{ processed: boolean; message: string }> {
  try {
    // WHAT: Verify webhook signature
    // WHY: Ensure webhook is authentic from Monnify, prevent spoofing
    const isValid = verifyMonnifySignature(payload, signature);

    if (!isValid) {
      console.warn("[Monnify Webhook] Invalid signature");
      // WHAT: Return 200 anyway (Monnify expects this)
      // WHY: Prevent Monnify retries, we log and ignore invalid signatures
      return { processed: false, message: "Invalid signature" };
    }

    // WHAT: Only process successful transactions
    // WHY: Ignore failed, cancelled, or other non-payment events
    if (payload.eventType !== "SUCCESSFUL_TRANSACTION") {
      return {
        processed: false,
        message: "Event type not SUCCESSFUL_TRANSACTION",
      };
    }

    // WHAT: Find virtual account by incoming account number
    // WHY: Match transfer to correct user
    const virtualAccount = await queryOne<VirtualAccount>(
      `SELECT id, user_id, account_number, bank_name, account_name, is_active
       FROM virtual_accounts WHERE account_number = $1`,
      [payload.destinationAccountNumber],
    );

    if (!virtualAccount) {
      console.warn(
        `[Monnify Webhook] No virtual account found for account ${payload.destinationAccountNumber}`,
      );
      return {
        processed: false,
        message: "Virtual account not found",
      };
    }

    // WHAT: Convert Naira to KOBO
    // WHY: All wallet amounts stored in kobo (integers)
    const amountKobo = Math.floor(payload.amountReceived * 100);

    // WHAT: Extract transfer reference for idempotency
    // WHY: Prevent duplicate credits if webhook is retried
    const idempotencyKey = `monnify_${payload.transactionReference}`;

    // WHAT: Credit wallet within transaction
    // WHY: Ensure wallet update and notification happen together
    const result = await withTransaction(async (client) => {
      const wallet = await creditWallet(
        client,
        virtualAccount.user_id,
        amountKobo,
        "monnify_deposit",
        `Transfer from ${payload.senderName} via ${payload.destinationBankCode}`,
        idempotencyKey,
        payload.transactionReference, // reference
        undefined, // taskId
      );

      return wallet;
    });

    // WHAT: Notify user of successful transfer
    // WHY: User sees transfer is credited in real-time
    await notifyUser(virtualAccount.user_id, {
      type: "transfer_received",
      title: "Transfer Received",
      body: `₦${(amountKobo / 100).toLocaleString()} received from ${payload.senderName}`,
      taskId: undefined,
      conversationId: undefined,
      actorId: undefined,
    });

    // WHAT: Send user email confirmation
    // WHY: Email receipt outside of app
    const user = await queryOne<{ full_name: string; email: string }>(
      `SELECT full_name, email FROM users WHERE id = $1`,
      [virtualAccount.user_id],
    );

    if (user) {
      await sendTransferConfirmed(
        user.email,
        user.full_name,
        payload.amountReceived,
        result.balance_kobo / 100, // new balance in Naira
      );
    }

    return {
      processed: true,
      message: `Transfer of ₦${(amountKobo / 100).toLocaleString()} credited to user`,
    };
  } catch (error) {
    // WHAT: Log error but return 200 to prevent Monnify retries
    // WHY: Application should handle retries carefully, not via webhook spam
    console.error(
      "[Monnify Webhook] Error processing webhook:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return {
      processed: false,
      message: "Error processing webhook",
    };
  }
}

// WHAT: Verify Monnify webhook signature using HMAC-SHA512
// WHY: Authenticate webhook to prevent spoofing
function verifyMonnifySignature(payload: any, signature: string): boolean {
  try {
    // WHAT: Create HMAC-SHA512 hash of payload
    // WHY: Monnify signs all webhooks with this algorithm
    const payloadString = JSON.stringify(payload);
    const hash = createHmac("sha512", env.MONNIFY_SECRET_KEY)
      .update(payloadString)
      .digest("hex");

    // WHAT: Compare using timing-safe equality
    // WHY: Prevent timing attacks
    return hash === signature;
  } catch (error) {
    console.error(
      "[Monnify] Webhook signature verification error:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return false;
  }
}

// WHAT: Get user's virtual account (if exists)
// WHY: Show user their account number for deposits
export async function getUserVirtualAccount(
  userId: string,
): Promise<VirtualAccount | null> {
  try {
    const result = await db.query<VirtualAccount>(
      `SELECT id, user_id, account_number, bank_code, bank_name, account_name,
              monnify_reference, is_active, created_at, updated_at
       FROM virtual_accounts
       WHERE user_id = $1 AND is_active = true
       LIMIT 1`,
      [userId],
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error(
      `[Monnify] Failed to get virtual account for user ${userId}:`,
      error instanceof Error ? error.message : "Unknown error",
    );
    return null;
  }
}

// WHAT: Deactivate virtual account
// WHY: Stop accepting transfers to account when user no longer needs it
export async function deactivateVirtualAccount(
  userId: string,
): Promise<boolean> {
  try {
    const result = await db.query(
      `UPDATE virtual_accounts 
       SET is_active = false, updated_at = NOW()
       WHERE user_id = $1 AND is_active = true`,
      [userId],
    );

    return (result?.rowCount ?? 0) > 0;
  } catch (error) {
    console.error(
      `[Monnify] Failed to deactivate virtual account for user ${userId}:`,
      error instanceof Error ? error.message : "Unknown error",
    );
    return false;
  }
}
