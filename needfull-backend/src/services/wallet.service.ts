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
  earnings_kobo: number;
  pending_earnings_kobo: number;
  updated_at: string;
  // WHAT: Id of the wallet_transactions row created by this operation (or the
  // matching existing row when the idempotency key hit). Undefined when no
  // transaction row was created.
  // WHY: Callers like confirmManualTransfer store it as wallet_tx_id (FK to
  // wallet_transactions.id) — the wallet id itself is NOT a valid FK value.
  walletTxId?: string;
}

// WHAT: Helper to alias wallet DB columns (balance/escrow → balance_kobo/escrow_kobo)
// WHY: DB uses `balance`/`escrow` but TypeScript uses `_kobo` suffix for consistency
const WALLET_SELECT =
  "id, user_id, balance AS balance_kobo, escrow AS escrow_kobo, earnings AS earnings_kobo, pending_earnings AS pending_earnings_kobo, updated_at";

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
      `SELECT ${WALLET_SELECT}
        FROM wallets WHERE user_id = $1 FOR UPDATE`,
      [userId],
    );

    if (wallet.rows.length === 0) {
      throw new Error(`Wallet not found for user ${userId}`);
    }

    const walletRow = wallet.rows[0];
    // WHAT: bigint columns come back from pg as strings — force numeric before
    //       any arithmetic so "+" is addition, never string concatenation
    const balanceBefore = Number(walletRow.balance_kobo);

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
        return { ...walletRow, walletTxId: existing.rows[0].id };
      }
    }

    // WHAT: Update wallet balance
    // WHY: Add amount to balance
    const newBalance = balanceBefore + amountKobo;
    const updated = await client.query<Wallet>(
      `UPDATE wallets SET balance = balance + $1, updated_at = NOW()
       WHERE id = $2 RETURNING ${WALLET_SELECT}`,
      [amountKobo, walletRow.id],
    );

    // WHAT: Record transaction for audit trail
    // WHY: Maintain complete history of all wallet movements
    const txResult = await client.query<{ id: string }>(
      `INSERT INTO wallet_transactions 
       (wallet_id, type, amount, balance_before, balance_after, 
        reference, idempotency_key, task_id, note, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       RETURNING id`,
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

    return { ...updated.rows[0], walletTxId: txResult.rows[0]?.id };
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
      `SELECT ${WALLET_SELECT}
        FROM wallets WHERE user_id = $1 FOR UPDATE`,
      [userId],
    );

    if (wallet.rows.length === 0) {
      throw new Error(`Wallet not found for user ${userId}`);
    }

    const walletRow = wallet.rows[0];
    const balanceBefore = Number(walletRow.balance_kobo);

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
      `UPDATE wallets SET balance = balance - $1, updated_at = NOW()
       WHERE id = $2 RETURNING ${WALLET_SELECT}`,
      [amountKobo, walletRow.id],
    );

    // WHAT: Record transaction for audit trail
    // WHY: Track all debits with timestamps and types
    await client.query(
      `INSERT INTO wallet_transactions 
       (wallet_id, type, amount, balance_before, balance_after, 
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

// WHAT: Lock task budget in escrow when task is posted (or lock additional
//       funding after a proposal is accepted)
// WHY: Reserve funds for task without releasing until runner completes it
// NOTE: Also keeps tasks.escrow_amount_kobo (per-task mirror) in sync — the
//       mirror is ONLY ever changed here, inside the same transaction that
//       moves the wallet escrow, so the two can never drift apart.
export async function lockEscrow(
  client: PoolClient,
  posterId: string,
  amountKobo: number,
  taskId: string,
  opts?: { idempotencyKey?: string; reference?: string; note?: string },
): Promise<Wallet> {
  try {
    // WHAT: Lock wallet for exclusive access
    // WHY: Prevent concurrent escrow operations
    const wallet = await client.query<Wallet>(
      `SELECT ${WALLET_SELECT}
        FROM wallets WHERE user_id = $1 FOR UPDATE`,
      [posterId],
    );

    if (wallet.rows.length === 0) {
      throw new Error(`Wallet not found for user ${posterId}`);
    }

    const walletRow = wallet.rows[0];
    const balanceBefore = Number(walletRow.balance_kobo);

    // WHAT: Check idempotency key if provided
    // WHY: Prevent duplicate escrow locks from retried funding requests —
    //      a single funding action must never lock the amount twice
    if (opts?.idempotencyKey) {
      const existing = await client.query(
        `SELECT id FROM wallet_transactions 
         WHERE wallet_id = $1 AND idempotency_key = $2`,
        [walletRow.id, opts.idempotencyKey],
      );
      if (existing.rows.length > 0) {
        return { ...walletRow, walletTxId: existing.rows[0].id };
      }
    }

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
       SET balance = balance - $1, 
           escrow = escrow + $1,
           updated_at = NOW()
       WHERE id = $2 
       RETURNING ${WALLET_SELECT}`,
      [amountKobo, walletRow.id],
    );

    // WHAT: Keep the per-task escrow mirror in sync (same transaction)
    await client.query(
      `UPDATE tasks SET escrow_amount_kobo = escrow_amount_kobo + $1, updated_at = NOW()
       WHERE id = $2`,
      [amountKobo, taskId],
    );

    // WHAT: Record escrow lock transaction
    // WHY: Maintain audit trail of escrow movements
    await client.query(
      `INSERT INTO wallet_transactions 
       (wallet_id, type, amount, balance_before, balance_after, 
        task_id, reference, idempotency_key, note, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
      [
        walletRow.id,
        "escrow_lock",
        amountKobo,
        balanceBefore,
        balanceBefore - amountKobo,
        taskId,
        opts?.reference || null,
        opts?.idempotencyKey || null,
        opts?.note || `Task budget locked for task ${taskId}`,
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
  opts?: { idempotencyKey?: string; note?: string },
): Promise<{ posterWallet: Wallet; runnerWallet: Wallet }> {
  try {
    // WHAT: Calculate platform fee and runner payout
    // WHY: Ensure consistent fee calculation across all payouts
    const feeKobo = Math.floor((amountKobo * feePct) / 100);
    const runnerReceives = amountKobo - feeKobo;

    // WHAT: Lock both wallets to prevent concurrent modifications
    // WHY: Atomic operation - both wallets must update together or not at all
    const posterWallet = await client.query<Wallet>(
      `SELECT ${WALLET_SELECT}
        FROM wallets WHERE user_id = $1 FOR UPDATE`,
      [posterId],
    );

    if (posterWallet.rows.length === 0) {
      throw new Error(`Poster wallet not found for user ${posterId}`);
    }

    const runnerWallet = await client.query<Wallet>(
      `SELECT ${WALLET_SELECT}
        FROM wallets WHERE user_id = $1 FOR UPDATE`,
      [runnerId],
    );

    if (runnerWallet.rows.length === 0) {
      throw new Error(`Runner wallet not found for user ${runnerId}`);
    }

    const posterWalletRow = posterWallet.rows[0];
    const runnerWalletRow = runnerWallet.rows[0];
    const posterEscrowBefore = Number(posterWalletRow.escrow_kobo);
    const runnerEarningsBefore = Number(runnerWalletRow.earnings_kobo);

    // WHAT: Check idempotency key if provided
    // WHY: A duplicate settlement request must never release the same escrow
    //      twice — return the (pre-settlement) state, not a second payout
    if (opts?.idempotencyKey) {
      const existing = await client.query(
        `SELECT id FROM wallet_transactions 
         WHERE wallet_id = $1 AND idempotency_key = $2`,
        [posterWalletRow.id, opts.idempotencyKey],
      );
      if (existing.rows.length > 0) {
        return { posterWallet: posterWalletRow, runnerWallet: runnerWalletRow };
      }
    }

    // WHAT: Release escrow from poster's wallet
    // WHY: Remove from escrow hold, funds go to platform
    const posterUpdated = await client.query<Wallet>(
      `UPDATE wallets 
       SET escrow = escrow - $1, updated_at = NOW()
       WHERE id = $2 
       RETURNING ${WALLET_SELECT}`,
      [amountKobo, posterWalletRow.id],
    );

    // WHAT: Keep the per-task escrow mirror in sync (same transaction)
    await client.query(
      `UPDATE tasks SET escrow_amount_kobo = escrow_amount_kobo - $1, updated_at = NOW()
       WHERE id = $2`,
      [amountKobo, taskId],
    );

    // WHAT: Credit runner's earnings bucket — NOT the spendable balance
    // WHY: Runner money is earned money. Keeping it in a separate bucket means
    //      funded deposits (poster wallet) can never be withdrawn as earnings
    const runnerUpdated = await client.query<Wallet>(
      `UPDATE wallets 
       SET earnings = earnings + $1, updated_at = NOW()
       WHERE id = $2 
       RETURNING ${WALLET_SELECT}`,
      [runnerReceives, runnerWalletRow.id],
    );

    // WHAT: Record escrow release transaction for runner (earnings)
    // WHY: Show runner what they earned; before/after reflect the earnings
    //      bucket, not the (untouched) spendable balance
    await client.query(
      `INSERT INTO wallet_transactions 
       (wallet_id, type, amount, balance_before, balance_after, 
        task_id, idempotency_key, note, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        runnerWalletRow.id,
        "earnings",
        runnerReceives,
        runnerEarningsBefore,
        runnerEarningsBefore + runnerReceives,
        taskId,
        opts?.idempotencyKey ? `${opts.idempotencyKey}_runner` : null,
        opts?.note || `Available earnings from task ${taskId}`,
      ],
    );

    // WHAT: Record platform fee transaction
    // WHY: Track all fees for financial reconciliation
    await client.query(
      `INSERT INTO wallet_transactions 
       (wallet_id, type, amount, balance_before, balance_after, 
        task_id, idempotency_key, note, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        posterWalletRow.id,
        "platform_fee",
        feeKobo,
        posterEscrowBefore,
        posterEscrowBefore - amountKobo,
        taskId,
        opts?.idempotencyKey ? `${opts.idempotencyKey}_fee` : null,
        opts?.note
          ? `${opts.note} — Platform fee (${feePct}%)`
          : `Platform fee (${feePct}%) for task ${taskId}`,
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
// WHY: Cancel task and return funds to available balance (also refunds the
//      EXCESS escrow after settlement when the agreed amount was LOWER than
//      the originally secured amount — see §6 of the negotiation rules)
export async function refundEscrow(
  client: PoolClient,
  posterId: string,
  amountKobo: number,
  taskId: string,
  opts?: { idempotencyKey?: string; note?: string },
): Promise<Wallet> {
  try {
    // WHAT: Lock wallet for exclusive access
    // WHY: Prevent concurrent escrow operations
    const wallet = await client.query<Wallet>(
      `SELECT ${WALLET_SELECT}
        FROM wallets WHERE user_id = $1 FOR UPDATE`,
      [posterId],
    );

    if (wallet.rows.length === 0) {
      throw new Error(`Wallet not found for user ${posterId}`);
    }

    const walletRow = wallet.rows[0];
    const escrowBefore = Number(walletRow.escrow_kobo);

    // WHAT: Check idempotency key if provided
    // WHY: Prevent duplicate refunds from retried requests
    if (opts?.idempotencyKey) {
      const existing = await client.query(
        `SELECT id FROM wallet_transactions 
         WHERE wallet_id = $1 AND idempotency_key = $2`,
        [walletRow.id, opts.idempotencyKey],
      );
      if (existing.rows.length > 0) {
        return { ...walletRow, walletTxId: existing.rows[0].id };
      }
    }

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
       SET escrow = escrow - $1, 
           balance = balance + $1,
           updated_at = NOW()
       WHERE id = $2 
       RETURNING ${WALLET_SELECT}`,
      [amountKobo, walletRow.id],
    );

    // WHAT: Keep the per-task escrow mirror in sync (same transaction)
    await client.query(
      `UPDATE tasks SET escrow_amount_kobo = escrow_amount_kobo - $1, updated_at = NOW()
       WHERE id = $2`,
      [amountKobo, taskId],
    );

    // WHAT: Record escrow refund transaction
    // WHY: Maintain audit trail of refunds
    await client.query(
      `INSERT INTO wallet_transactions 
       (wallet_id, type, amount, balance_before, balance_after, 
        task_id, idempotency_key, note, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        walletRow.id,
        "escrow_refund",
        amountKobo,
        Number(walletRow.balance_kobo),
        Number(walletRow.balance_kobo) + amountKobo,
        taskId,
        opts?.idempotencyKey || null,
        opts?.note || `Escrow refunded for cancelled task ${taskId}`,
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
  earnings_kobo: number;
  pending_earnings_kobo: number;
  balance_naira: number;
  escrow_naira: number;
  earnings_naira: number;
  pending_kobo: number;
  pending_naira: number;
}> {
  try {
    // WHAT: Query wallet without locks (read-only)
    // WHY: Avoid blocking concurrent writes for simple reads
    const result = await queryOne<{
      id: string;
      balance_kobo: number;
      escrow_kobo: number;
      earnings_kobo: number;
      pending_earnings_kobo: number;
    }>(`SELECT id, balance AS balance_kobo, escrow AS escrow_kobo, earnings AS earnings_kobo, pending_earnings AS pending_earnings_kobo FROM wallets WHERE user_id = $1`, [
      userId,
    ]);

    // WHAT: Runner's pending release — the payout slice of tasks the runner has
    // marked done but the poster has not confirmed yet
    // WHY: Money is still held in the poster's escrow until confirmation; this
    //      is a live, computed number, not a stored balance
    const pendingRes = await queryOne<{ pending_kobo: number }>(
      `SELECT COALESCE(SUM(COALESCE(agreed_amount_kobo, budget_kobo)), 0)::int AS pending_kobo
       FROM tasks
       WHERE assigned_to = $1 AND status = 'in_progress' AND runner_done_at IS NOT NULL`,
      [userId],
    );
    const pendingKobo = pendingRes?.pending_kobo ?? 0;

    // WHAT: Coerce bigint strings to numbers before serializing for the API
    // WHY:  pg returns bigint as string — clients must never see string balances
    const balanceKobo = Number(result.balance_kobo);
    const escrowKobo = Number(result.escrow_kobo);
    const earningsKobo = Number(result.earnings_kobo);

    return {
      id: result.id,
      balance_kobo: balanceKobo,
      escrow_kobo: escrowKobo,
      earnings_kobo: earningsKobo,
      pending_earnings_kobo: pendingKobo,
      balance_naira: balanceKobo / 100,
      escrow_naira: escrowKobo / 100,
      earnings_naira: earningsKobo / 100,
      pending_kobo: pendingKobo,
      pending_naira: pendingKobo / 100,
    };
  } catch (error) {
    throw new Error(
      `Failed to get wallet for user ${userId}: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

// WHAT: Debit Available Earnings (runner withdrawals only)
// WHY: Runner withdrawals draw solely from earned money — never from the
//      funded balance. Locked + ledgered like every other wallet movement.
export async function debitEarnings(
  client: PoolClient,
  userId: string,
  amountKobo: number,
  type: string,
  note: string,
  idempotencyKey?: string,
): Promise<Wallet> {
  const wallet = await client.query<Wallet>(
    `SELECT ${WALLET_SELECT}
      FROM wallets WHERE user_id = $1 FOR UPDATE`,
    [userId],
  );

  if (wallet.rows.length === 0) {
    throw new Error(`Wallet not found for user ${userId}`);
  }

  const walletRow = wallet.rows[0];
  if (walletRow.earnings_kobo < amountKobo) {
    throw new Error(
      `Insufficient available earnings. Required: ₦${(amountKobo / 100).toFixed(2)}, Available: ₦${(walletRow.earnings_kobo / 100).toFixed(2)}`,
    );
  }

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

  const earningsBefore = Number(walletRow.earnings_kobo);
  const updated = await client.query<Wallet>(
    `UPDATE wallets SET earnings = earnings - $1, updated_at = NOW()
     WHERE id = $2 RETURNING ${WALLET_SELECT}`,
    [amountKobo, walletRow.id],
  );

  await client.query(
    `INSERT INTO wallet_transactions 
     (wallet_id, type, amount, balance_before, balance_after, 
      idempotency_key, note, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
    [
      walletRow.id,
      type,
      amountKobo,
      earningsBefore,
      earningsBefore - amountKobo,
      idempotencyKey || null,
      note,
    ],
  );

  return updated.rows[0];
}

// WHAT: Credit Available Earnings back (failed-runner-withdrawal refunds, etc.)
export async function creditEarnings(
  client: PoolClient,
  userId: string,
  amountKobo: number,
  type: string,
  note: string,
  idempotencyKey?: string,
): Promise<Wallet> {
  const wallet = await client.query<Wallet>(
    `SELECT ${WALLET_SELECT}
      FROM wallets WHERE user_id = $1 FOR UPDATE`,
    [userId],
  );

  if (wallet.rows.length === 0) {
    throw new Error(`Wallet not found for user ${userId}`);
  }

  const walletRow = wallet.rows[0];

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

  const earningsBefore = Number(walletRow.earnings_kobo);
  const updated = await client.query<Wallet>(
    `UPDATE wallets SET earnings = earnings + $1, updated_at = NOW()
     WHERE id = $2 RETURNING ${WALLET_SELECT}`,
    [amountKobo, walletRow.id],
  );

  await client.query(
    `INSERT INTO wallet_transactions 
     (wallet_id, type, amount, balance_before, balance_after, 
      idempotency_key, note, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
    [
      walletRow.id,
      type,
      amountKobo,
      earningsBefore,
      earningsBefore + amountKobo,
      idempotencyKey || null,
      note,
    ],
  );

  return updated.rows[0];
}
