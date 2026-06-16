// WHAT: Wallet service - ONLY place that modifies wallet balances (Phase 3)
// WHY: Centralized, transactional control prevents race conditions and balance corruption
// FUTURE: Add wallet audit log for compliance, add rate limiting on transfers, add wallet holds for pending tasks

import { PoolClient } from "pg";
import { queryOne } from "../config/db";
import { PLATFORM_FEE_PERCENT } from "../config/constants";

// WHAT: Wallet row structure
interface Wallet {
  id: string;
  user_id: string;
  balance_kobo: number;
  escrow_kobo: number;
  updated_at: string;
}

// WHAT: Credit wallet with amount (deposit, earnings, refund)
// WHY: Add funds to user wallet with idempotency protection and audit trail
export async function creditWallet(
  client: PoolClient,
  userId: string,
  amountKobo: number,
  type: string,
  note: string,
  idempotencyKey?: string,
  reference?: string,
  taskId?: string,
): Promise<Wallet> {
  try {
    // WHAT: Lock wallet row to prevent concurrent modifications
    // WHY: SELECT FOR UPDATE ensures no race conditions on balance updates
    const wallet = await client.query<Wallet>(
      `SELECT id, user_id, balance_kobo, escrow_kobo, updated_at
       FROM wallets WHERE user_id = $1 FOR UPDATE`,
      [userId],
    );

    if (wallet.rows.length === 0) {
      throw new Error(`Wallet not found for user ${userId}`);
    }

    const walletRow = wallet.rows[0];
    const balanceBefore = walletRow.balance_kobo;

    // WHAT: Check idempotency key if provided
    // WHY: Prevent duplicate credits from retried requests
    if (idempotencyKey) {
      const existing = await client.query(
        `SELECT id FROM wallet_transactions 
         WHERE wallet_id = $1 AND idempotency_key = $2`,
        [walletRow.id, idempotencyKey],
      );

      if (existing.rows.length > 0) {
        // WHAT: Return existing wallet state on duplicate request
        // WHY: Idempotent operation - same result as first request
        return walletRow;
      }
    }

    // WHAT: Update wallet balance
    // WHY: Add amount to balance
    const newBalance = balanceBefore + amountKobo;
    const updated = await client.query<Wallet>(
      `UPDATE wallets SET balance_kobo = balance_kobo + $1, updated_at = NOW()
       WHERE id = $2 RETURNING id, user_id, balance_kobo, escrow_kobo, updated_at`,
      [amountKobo, walletRow.id],
    );

    // WHAT: Record transaction for audit trail
    // WHY: Maintain complete history of all wallet movements
    await client.query(
      `INSERT INTO wallet_transactions 
       (wallet_id, type, amount_kobo, balance_before_kobo, balance_after_kobo, 
        reference, idempotency_key, task_id, note, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
      [
        walletRow.id,
        type,
        amountKobo,
        balanceBefore,
        newBalance,
        reference || null,
        idempotencyKey || null,
        taskId || null,
        note,
      ],
    );

    return updated.rows[0];
  } catch (error) {
    throw new Error(
      `Failed to credit wallet for user ${userId}: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

// WHAT: Debit wallet (withdrawal, fee, hold)
// WHY: Safely remove funds with balance check and transaction logging
export async function debitWallet(
  client: PoolClient,
  userId: string,
  amountKobo: number,
  type: string,
  note: string,
  taskId?: string,
  idempotencyKey?: string,
): Promise<Wallet> {
  try {
    // WHAT: Lock wallet for exclusive access
    // WHY: Prevent concurrent debits that could overdraw
    const wallet = await client.query<Wallet>(
      `SELECT id, user_id, balance_kobo, escrow_kobo, updated_at
       FROM wallets WHERE user_id = $1 FOR UPDATE`,
      [userId],
    );

    if (wallet.rows.length === 0) {
      throw new Error(`Wallet not found for user ${userId}`);
    }

    const walletRow = wallet.rows[0];
    const balanceBefore = walletRow.balance_kobo;

    // WHAT: Check sufficient balance before debit
    // WHY: Prevent negative balances (hard constraint)
    if (balanceBefore < amountKobo) {
      throw new Error(
        `Insufficient balance. Required: ₦${(amountKobo / 100).toFixed(2)}, Available: ₦${(balanceBefore / 100).toFixed(2)}`,
      );
    }

    // WHAT: Check idempotency key if provided
    // WHY: Prevent duplicate debits from retried requests
    if (idempotencyKey) {
      const existing = await client.query(
        `SELECT id FROM wallet_transactions 
         WHERE wallet_id = $1 AND idempotency_key = $2`,
        [walletRow.id, idempotencyKey],
      );

      if (existing.rows.length > 0) {
        return walletRow;
      }
    }

    // WHAT: Update wallet balance (subtract)
    // WHY: Remove amount from available balance
    const newBalance = balanceBefore - amountKobo;
    const updated = await client.query<Wallet>(
      `UPDATE wallets SET balance_kobo = balance_kobo - $1, updated_at = NOW()
       WHERE id = $2 RETURNING id, user_id, balance_kobo, escrow_kobo, updated_at`,
      [amountKobo, walletRow.id],
    );

    // WHAT: Record transaction for audit trail
    // WHY: Track all debits with timestamps and types
    await client.query(
      `INSERT INTO wallet_transactions 
       (wallet_id, type, amount_kobo, balance_before_kobo, balance_after_kobo, 
        task_id, idempotency_key, note, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        walletRow.id,
        type,
        amountKobo,
        balanceBefore,
        newBalance,
        taskId || null,
        idempotencyKey || null,
        note,
      ],
    );

    return updated.rows[0];
  } catch (error) {
    throw new Error(
      `Failed to debit wallet for user ${userId}: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

// WHAT: Lock task budget in escrow when task is posted
// WHY: Reserve funds for task without releasing until runner completes it
export async function lockEscrow(
  client: PoolClient,
  posterId: string,
  amountKobo: number,
  taskId: string,
): Promise<Wallet> {
  try {
    // WHAT: Lock wallet for exclusive access
    // WHY: Prevent concurrent escrow operations
    const wallet = await client.query<Wallet>(
      `SELECT id, user_id, balance_kobo, escrow_kobo, updated_at
       FROM wallets WHERE user_id = $1 FOR UPDATE`,
      [posterId],
    );

    if (wallet.rows.length === 0) {
      throw new Error(`Wallet not found for user ${posterId}`);
    }

    const walletRow = wallet.rows[0];
    const balanceBefore = walletRow.balance_kobo;

    // WHAT: Check sufficient balance for escrow lock
    // WHY: Prevent locking funds that don't exist
    if (balanceBefore < amountKobo) {
      throw new Error(
        `Insufficient balance to lock ₦${(amountKobo / 100).toFixed(2)} in escrow. Available: ₦${(balanceBefore / 100).toFixed(2)}`,
      );
    }

    // WHAT: Move funds from balance to escrow
    // WHY: Hold task budget until completion/cancellation
    const updated = await client.query<Wallet>(
      `UPDATE wallets 
       SET balance_kobo = balance_kobo - $1, 
           escrow_kobo = escrow_kobo + $1,
           updated_at = NOW()
       WHERE id = $2 
       RETURNING id, user_id, balance_kobo, escrow_kobo, updated_at`,
      [amountKobo, walletRow.id],
    );

    // WHAT: Record escrow lock transaction
    // WHY: Maintain audit trail of escrow movements
    await client.query(
      `INSERT INTO wallet_transactions 
       (wallet_id, type, amount_kobo, balance_before_kobo, balance_after_kobo, 
        task_id, note, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        walletRow.id,
        "escrow_lock",
        amountKobo,
        balanceBefore,
        balanceBefore - amountKobo,
        taskId,
        `Task budget locked for task ${taskId}`,
      ],
    );

    return updated.rows[0];
  } catch (error) {
    throw new Error(
      `Failed to lock escrow for user ${posterId}: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

// WHAT: Release escrow to runner after task completion
// WHY: Pay runner their portion minus platform fee, update poster's escrow
export async function releaseEscrow(
  client: PoolClient,
  posterId: string,
  runnerId: string,
  amountKobo: number,
  taskId: string,
  feePct: number = PLATFORM_FEE_PERCENT,
): Promise<{ posterWallet: Wallet; runnerWallet: Wallet }> {
  try {
    // WHAT: Calculate platform fee and runner payout
    // WHY: Ensure consistent fee calculation across all payouts
    const feeKobo = Math.floor((amountKobo * feePct) / 100);
    const runnerReceives = amountKobo - feeKobo;

    // WHAT: Lock both wallets to prevent concurrent modifications
    // WHY: Atomic operation - both wallets must update together or not at all
    const posterWallet = await client.query<Wallet>(
      `SELECT id, user_id, balance_kobo, escrow_kobo, updated_at
       FROM wallets WHERE user_id = $1 FOR UPDATE`,
      [posterId],
    );

    if (posterWallet.rows.length === 0) {
      throw new Error(`Poster wallet not found for user ${posterId}`);
    }

    const runnerWallet = await client.query<Wallet>(
      `SELECT id, user_id, balance_kobo, escrow_kobo, updated_at
       FROM wallets WHERE user_id = $1 FOR UPDATE`,
      [runnerId],
    );

    if (runnerWallet.rows.length === 0) {
      throw new Error(`Runner wallet not found for user ${runnerId}`);
    }

    const posterWalletRow = posterWallet.rows[0];
    const runnerWalletRow = runnerWallet.rows[0];
    const posterEscrowBefore = posterWalletRow.escrow_kobo;
    const runnerBalanceBefore = runnerWalletRow.balance_kobo;

    // WHAT: Release escrow from poster's wallet
    // WHY: Remove from escrow hold, funds go to platform
    const posterUpdated = await client.query<Wallet>(
      `UPDATE wallets 
       SET escrow_kobo = escrow_kobo - $1, updated_at = NOW()
       WHERE id = $2 
       RETURNING id, user_id, balance_kobo, escrow_kobo, updated_at`,
      [amountKobo, posterWalletRow.id],
    );

    // WHAT: Credit runner with payout minus fee
    // WHY: Give runner their earnings
    const runnerUpdated = await client.query<Wallet>(
      `UPDATE wallets 
       SET balance_kobo = balance_kobo + $1, updated_at = NOW()
       WHERE id = $2 
       RETURNING id, user_id, balance_kobo, escrow_kobo, updated_at`,
      [runnerReceives, runnerWalletRow.id],
    );

    // WHAT: Record escrow release transaction for runner (earnings)
    // WHY: Show runner what they earned
    await client.query(
      `INSERT INTO wallet_transactions 
       (wallet_id, type, amount_kobo, balance_before_kobo, balance_after_kobo, 
        task_id, note, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        runnerWalletRow.id,
        "earnings",
        runnerReceives,
        runnerBalanceBefore,
        runnerBalanceBefore + runnerReceives,
        taskId,
        `Earnings from task ${taskId}`,
      ],
    );

    // WHAT: Record platform fee transaction
    // WHY: Track all fees for financial reconciliation
    await client.query(
      `INSERT INTO wallet_transactions 
       (wallet_id, type, amount_kobo, balance_before_kobo, balance_after_kobo, 
        task_id, note, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        posterWalletRow.id,
        "platform_fee",
        feeKobo,
        posterEscrowBefore,
        posterEscrowBefore - amountKobo,
        taskId,
        `Platform fee (${feePct}%) for task ${taskId}`,
      ],
    );

    return {
      posterWallet: posterUpdated.rows[0],
      runnerWallet: runnerUpdated.rows[0],
    };
  } catch (error) {
    throw new Error(
      `Failed to release escrow for task ${taskId}: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

// WHAT: Refund locked escrow back to poster's balance
// WHY: Cancel task and return funds to available balance
export async function refundEscrow(
  client: PoolClient,
  posterId: string,
  amountKobo: number,
  taskId: string,
): Promise<Wallet> {
  try {
    // WHAT: Lock wallet for exclusive access
    // WHY: Prevent concurrent escrow operations
    const wallet = await client.query<Wallet>(
      `SELECT id, user_id, balance_kobo, escrow_kobo, updated_at
       FROM wallets WHERE user_id = $1 FOR UPDATE`,
      [posterId],
    );

    if (wallet.rows.length === 0) {
      throw new Error(`Wallet not found for user ${posterId}`);
    }

    const walletRow = wallet.rows[0];
    const escrowBefore = walletRow.escrow_kobo;

    // WHAT: Check sufficient escrow to refund
    // WHY: Prevent refunding more than was locked
    if (escrowBefore < amountKobo) {
      throw new Error(
        `Insufficient escrow to refund. Locked: ₦${(escrowBefore / 100).toFixed(2)}, Requested: ₦${(amountKobo / 100).toFixed(2)}`,
      );
    }

    // WHAT: Move funds from escrow back to balance
    // WHY: Restore available balance when task is cancelled
    const updated = await client.query<Wallet>(
      `UPDATE wallets 
       SET escrow_kobo = escrow_kobo - $1, 
           balance_kobo = balance_kobo + $1,
           updated_at = NOW()
       WHERE id = $2 
       RETURNING id, user_id, balance_kobo, escrow_kobo, updated_at`,
      [amountKobo, walletRow.id],
    );

    // WHAT: Record escrow refund transaction
    // WHY: Maintain audit trail of refunds
    await client.query(
      `INSERT INTO wallet_transactions 
       (wallet_id, type, amount_kobo, balance_before_kobo, balance_after_kobo, 
        task_id, note, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        walletRow.id,
        "escrow_refund",
        amountKobo,
        walletRow.balance_kobo,
        walletRow.balance_kobo + amountKobo,
        taskId,
        `Escrow refunded for cancelled task ${taskId}`,
      ],
    );

    return updated.rows[0];
  } catch (error) {
    throw new Error(
      `Failed to refund escrow for user ${posterId}: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

// WHAT: Get wallet details with Naira conversion
// WHY: Read-only operation for UI display and balance checks
export async function getWallet(userId: string): Promise<{
  id: string;
  balance_kobo: number;
  escrow_kobo: number;
  balance_naira: number;
  escrow_naira: number;
}> {
  try {
    // WHAT: Query wallet without locks (read-only)
    // WHY: Avoid blocking concurrent writes for simple reads
    const result = await queryOne<{
      id: string;
      balance_kobo: number;
      escrow_kobo: number;
    }>(`SELECT id, balance_kobo, escrow_kobo FROM wallets WHERE user_id = $1`, [
      userId,
    ]);

    return {
      id: result.id,
      balance_kobo: result.balance_kobo,
      escrow_kobo: result.escrow_kobo,
      balance_naira: result.balance_kobo / 100,
      escrow_naira: result.escrow_kobo / 100,
    };
  } catch (error) {
    throw new Error(
      `Failed to get wallet for user ${userId}: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
