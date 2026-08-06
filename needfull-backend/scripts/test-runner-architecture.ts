// WHAT: One-shot integration test for the Runner Architecture Refactor
//       (earnings/funded money separation + OFF/ONLINE/BUSY availability).
// WHY:  Exercises the real services against the live Supabase schema using
//       throwaway users, then deletes everything it created.
// HOW:  cd needfull-backend && npx tsx scripts/test-runner-architecture.ts

process.env.SKIP_HTTP_LISTEN = "1";

import { randomBytes } from "node:crypto";
import db, { withTransaction } from "../src/config/db";
import {
  creditWallet,
  creditEarnings,
  debitEarnings,
  debitWallet,
  getWallet,
} from "../src/services/wallet.service";
import { createTask, markAsDone, confirmCompletion } from "../src/services/task.service";
import { apply, acceptApplication } from "../src/services/application.service";
import { PLATFORM_FEE_PERCENT } from "../src/config/constants";

let pass = 0;
let fail = 0;
function ok(cond: boolean, msg: string) {
  if (cond) {
    pass++;
    console.log(`  \u2713 ${msg}`);
  } else {
    fail++;
    console.error(`  \u2717 FAIL: ${msg}`);
  }
}
const eq = (got: unknown, want: unknown, msg: string) => {
  const g = typeof want === "number" ? Number(got) : got;
  ok(g === want, `${msg} (got ${g}, want ${want})`);
};

const suffix = randomBytes(4).toString("hex");
const idList: string[] = [];

type TestUser = { id: string; wallet: string };

async function insertTestUser(
  fullName: string,
  opts: { role: string; lat: number; lng: number },
) {
  const email = `it-${suffix}-${fullName.toLowerCase().replace(/\s+/g, "")}@needfull.test`;
  const res = await db.query<{ id: string }>(
    `INSERT INTO users
       (full_name, email, phone, password_hash, roles, active_role, email_verified_at,
        is_runner, is_available, trust_score, location)
     VALUES ($1, $2, '0000000000', 'test-hash',
             ARRAY[$3::text], $3, NOW(), $3 = 'runner', $3 = 'runner', 80,
             ST_SetSRID(ST_MakePoint($5::float, $4::float), 4326)::geography)
     RETURNING id`,
    [fullName, email, opts.role, opts.lat, opts.lng],
  );
  idList.push(res.rows[0].id);
  // A DB trigger auto-creates the wallet on user INSERT (live schema) — fetch it
  const w = await db.query<{ id: string }>(
    `SELECT id FROM wallets WHERE user_id = $1`,
    [res.rows[0].id],
  );
  return { id: res.rows[0].id, wallet: w.rows[0].id } satisfies TestUser;
}

// WHAT: Inline copy of matching.service getAvailableRunnersNear (avoid circular import)
async function nearbyRunners(lat: number, lng: number, radiusKm: number) {
  const res = await db.query<{ id: string }>(
    `SELECT u.id
     FROM users u
     WHERE u.is_runner = true
       AND u.is_available = true
       AND u.runner_busy = false
       AND u.is_banned = false
       AND u.trust_score >= 30
       AND u.location IS NOT NULL
       AND ST_DWithin(
         u.location,
         ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
         $3
       )`,
    [lng, lat, radiusKm * 1000],
  );
  return res.rows as { id: string }[];
}

async function cleanupTestData() {
  // WHAT: Remove every row the test may have created in past runs
  // WHY:  The test runs against the live DB — it must leave no trace behind
  const ids = (
    await db.query<{ id: string }>(`SELECT id FROM users WHERE email LIKE 'it-%@needfull.test'`)
  ).rows.map((r) => r.id);
  if (ids.length === 0) return;
  await db.query(`DELETE FROM notifications WHERE user_id = ANY($1::uuid[])`, [ids]);
  await db.query(`DELETE FROM reviews WHERE reviewer_id = ANY($1::uuid[]) OR reviewee_id = ANY($1::uuid[])`, [ids]);
  await db.query(`DELETE FROM task_applications WHERE applicant_id = ANY($1::uuid[]) OR runner_id = ANY($1::uuid[])`, [ids]);
  await db.query(`DELETE FROM tasks WHERE poster_id = ANY($1::uuid[]) OR assigned_to = ANY($1::uuid[])`, [ids]);
  await db.query(`DELETE FROM withdrawal_requests WHERE user_id = ANY($1::uuid[])`, [ids]);
  await db.query(
    `DELETE FROM wallet_transactions WHERE wallet_id IN (SELECT id FROM wallets WHERE user_id = ANY($1::uuid[]))`,
    [ids],
  );
  await db.query(`DELETE FROM user_preferences WHERE user_id = ANY($1::uuid[])`, [ids]);
  await db.query(`DELETE FROM trust_score_log WHERE user_id = ANY($1::uuid[])`, [ids]);
  await db.query(`DELETE FROM wallets WHERE user_id = ANY($1::uuid[])`, [ids]);
  await db.query(`DELETE FROM users WHERE id = ANY($1::uuid[])`, [ids]);
}

async function main() {
  await cleanupTestData();
  console.log(`\n=== Integration test (items suffix: ${suffix}) ===`);
  console.log(`Platform fee configured: ${PLATFORM_FEE_PERCENT}%`);

  const lat = 7.2577 + 0.001; // FUOYE area — offset so test task stays in the area
  const lng = 5.2058;

  const poster = await insertTestUser("Poster Test", { role: "poster", lat, lng });
  const runner = await insertTestUser("Runner Test", { role: "runner", lat, lng });
  console.log(`  poster=${poster.id} runner=${runner.id}`);

  // 1. Fund the poster
  const FUND = 500_000; // ₦5,000
  await withTransaction(async (c) => {
    await creditWallet(c, poster.id, FUND, "manual_deposit_confirmed", "test funding");
  });
  const w1 = await getWallet(poster.id);
  eq(w1.balance_kobo, FUND, "poster funded balance");
  eq(w1.earnings_kobo, 0, "poster earnings start at 0");
  eq(w1.escrow_kobo, 0, "poster escrow starts at 0");

  // 2. Runner availability — set is_available + runner_busy defaults
  await db.query(`UPDATE users SET is_available = TRUE WHERE id = $1`, [runner.id]);
  const runnerRow = await db.query<{ runner_busy: boolean; is_available: boolean }>(
    `SELECT runner_busy, is_available FROM users WHERE id = $1`,
    [runner.id],
  );
  ok(runnerRow.rows[0].is_available === true, "runner ONLINE (is_available=true)");
  ok(runnerRow.rows[0].runner_busy === false, "runner not busy at start");

  // 3. Matching finds the ONLINE runner — record baseline excludes busy
  const nearbyBefore = await nearbyRunners(lat, lng, 8);
  ok(nearbyBefore.some((r) => r.id === runner.id), "runner appears in nearby matching");
  ok(!nearbyBefore.some((r) => r.id === poster.id), "poster not matched as runner");

  // 4. Create a task — escrow locks the budget on publish
  const cat = await db.query<{ id: string }>(`SELECT id FROM categories ORDER BY sort_order LIMIT 1`);
  const taskRes = await createTask(poster.id, {
    categoryId: cat.rows[0].id,
    title: "Integration test task — carry a package across campus",
    description: "Created by integration test script, will be deleted.",
    budgetNaira: 100, // ₦100 → 10_000 kobo
    deadline: null,
    isUrgent: false,
    locationLabel: "FUOYE Main Gate",
    lat,
    lng,
  });
  const taskId = taskRes.id;
  ok(typeof taskId === "string", `task created (id=${taskId})`);

  const w2 = await getWallet(poster.id);
  eq(w2.escrow_kobo, 10_000, "poster escrow = budget after publish");
  eq(w2.balance_kobo, FUND - 10_000, "poster spendable reduced by budget");

  // 5. Runner applies
  const app = await apply(runner.id, {
    taskId,
    message: "Happy to help — integration test.",
    proposedAmountNaira: 100,
  });
  const applicationId = app.id as string;
  ok(typeof applicationId === "string", "application created");

  // 6. Accept → BUSY true, escrow stays at budget (delta only), task in_progress
  const accepted = await acceptApplication(applicationId, poster.id);
  eq(accepted.agreedAmount.kobo, 10_000, "agreed amount = budget");

  const runnerBusy = await db.query<{ runner_busy: boolean }>(
    `SELECT runner_busy FROM users WHERE id = $1`,
    [runner.id],
  );
  ok(runnerBusy.rows[0].runner_busy === true, "runner BUSY after accept");
  const w3 = await getWallet(poster.id);
  eq(w3.escrow_kobo, 10_000, "escrow stays at 10_000 after accept (no double lock)");
  eq(w3.balance_kobo, FUND - 10_000, "poster spendable unchanged by accept");

  // 6b. Matching now EXCLUDES the busy runner
  const nearbyAfter = await nearbyRunners(lat, lng, 8);
  ok(!nearbyAfter.some((r) => r.id === runner.id), "busy runner excluded from matching");

  // 7. Mark done → runner pending shown, balances unchanged
  await markAsDone(taskId, runner.id);
  const rw = await getWallet(runner.id);
  eq(rw.pending_kobo, 10_000, "runner pending_kobo = task value after markAsDone");
  eq(rw.earnings_kobo, 0, "runner earnings 0 before confirm");
  eq(rw.balance_kobo, 0, "runner spendable untouched");

  // 8. Shutdown: posting middle state money rules hold
  const w4 = await getWallet(poster.id);
  eq(w4.escrow_kobo, 10_000, "escrow still held while in_progress");

  // 9. Confirm completion → release to earnings, escrow zero, busy cleared
  await confirmCompletion(taskId, poster.id);
  const rw2 = await getWallet(runner.id);
  const feeKobo = Math.floor((10_000 * PLATFORM_FEE_PERCENT) / 100);
  const runnerNet = 10_000 - feeKobo;
  eq(rw2.earnings_kobo, runnerNet, `runner earnings = budget - fee (${runnerNet})`);
  eq(rw2.balance_kobo, 0, "runner balance untouched (separate bucket)");
  const w5 = await getWallet(poster.id);
  eq(w5.escrow_kobo, 0, "poster escrow released to 0");
  eq(w5.balance_kobo, FUND - 10_000, "poster spendable unchanged by release");

  const busyAfter = await db.query<{ runner_busy: boolean }>(
    `SELECT runner_busy FROM users WHERE id = $1`,
    [runner.id],
  );
  ok(busyAfter.rows[0].runner_busy === false, "runner free (BUSY cleared) after completion");

  // 10. Withdrawal primitives respect bucket separation
  await withTransaction(async (c) => {
    await debitEarnings(c, runner.id, 2_000, "earnings_withdrawal", "test runner draw", `tst-earn-${suffix}`);
  });
  const rw3 = await getWallet(runner.id);
  eq(rw3.earnings_kobo, runnerNet - 2_000, "runner earnings decreased by draw (earnings bucket)");
  eq(rw3.balance_kobo, 0, "runner balance still 0 (never touched by earnings ops)");

  await withTransaction(async (c) => {
    await debitWallet(c, poster.id, 5_000, "withdrawal_requested", "test poster draw", undefined, `tst-bal-${suffix}`);
  });
  const w6 = await getWallet(poster.id);
  eq(w6.balance_kobo, FUND - 10_000 - 5_000, "poster balance decreased by draw");
  eq(w6.escrow_kobo, 0, "poster escrow still 0");

  await withTransaction(async (c) => {
    await creditEarnings(c, runner.id, 500, "withdrawal_failed_refund", "test refund to earnings", `it-earn-ref-${suffix}`);
  });
  const rw4 = await getWallet(runner.id);
  eq(rw4.earnings_kobo, runnerNet - 2_000 + 500, "earnings refund lands in earnings bucket");

  // 11. Ledger uses earnings bucket for earnings transactions
  const ledger = await db.query<{ type: string; amount: bigint; balance_before: bigint; balance_after: bigint }>(
    `SELECT type, amount, balance_before, balance_after
     FROM wallet_transactions WHERE wallet_id = $1 ORDER BY created_at`,
    [runner.wallet],
  );
  const earnTx = ledger.rows.filter((r) => r.type === "earnings");
  eq(earnTx.length, 1, "one earnings release entry");
  if (earnTx[0]) {
    eq(Number(earnTx[0].amount), runnerNet, "earnings tx amount = net payout");
    eq(Number(earnTx[0].balance_before), 0, "earnings tx before = prior earnings");
    eq(Number(earnTx[0].balance_after), runnerNet, "earnings tx after = prior + net");
  }
  const earnWith = ledger.rows.filter((r) => r.type === "earnings_withdrawal");
  eq(earnWith.length, 1, "one earnings_withdrawal entry");

  // 11b. Ledger invariant: balance_after must always be real math on the stored
  // bigints (guards against string-concat regressions like before=10000,
  // amt=90000, after=1000090000)
  const pLedger = await db.query<{ type: string; amount: bigint; balance_before: bigint; balance_after: bigint }>(
    `SELECT type, amount, balance_before, balance_after
     FROM wallet_transactions WHERE wallet_id = $1 ORDER BY created_at`,
    [poster.wallet],
  );
  const depTx = pLedger.rows.find((r) => r.type === "manual_deposit_confirmed");
  ok(!!depTx, "deposit tx recorded on poster wallet");
  if (depTx) eq(Number(depTx.balance_after), Number(depTx.balance_before) + Number(depTx.amount), "deposit after = before + amount");
  const wdrTx = pLedger.rows.find((r) => r.type === "withdrawal_requested");
  ok(!!wdrTx, "withdrawal tx recorded on poster wallet");
  if (wdrTx) eq(Number(wdrTx.balance_after), Number(wdrTx.balance_before) - Number(wdrTx.amount), "withdrawal after = before - amount");

  // 12. Insufficient earnings rejected
  let insufficient = false;
  try {
    await withTransaction(async (c) => {
      await debitEarnings(c, runner.id, 10_000_000, "earnings_withdrawal", "too big", `it-earn-big-${suffix}`);
    });
  } catch {
    insufficient = true;
  }
  ok(insufficient, "debitEarnings rejects when earnings insufficient");

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed ===`);
  await cleanupTestData();
  await db.end();
  if (fail > 0) process.exit(1);
}

main().catch(async (e) => {
  console.error("[TEST] Unhandled error:", e);
  await db.end();
  process.exit(1);
});