// WHAT: End-to-end smoke test for the budget-negotiation pipeline (proposal →
//       accept → await funding → fund → idempotent retry, plus lower-offer,
//       reject, cancel, and duplicate-guard paths).
// WHY:  Verify the REAL money rules against the live DB without touching real
//       users: throwaway template-copied users/wallets, every row created is
//       deleted at the end. Run against the configured DATABASE_URL.
// USAGE: npx tsx scripts/smoke-negotiation.ts

process.env.SKIP_HTTP_LISTEN = "1";

import "dotenv/config";
import { Client } from "pg";
import { v4 as uuidv4 } from "uuid";
import db, { withTransaction } from "../src/config/db";
import { creditWallet } from "../src/services/wallet.service";
import { createTask } from "../src/services/task.service";
import { apply } from "../src/services/application.service";
import {
  acceptProposal,
  rejectProposal,
  cancelProposal,
  fundProposal,
  listProposals,
} from "../src/services/proposal.service";

const TEMPLATE_USER_ID = "53c52691-f4cd-4874-bd40-f9387f049482"; // dbg6 test.local user
const TS = Date.now();
const posterId = uuidv4();
const runnerId = uuidv4();
const posterEmail = `smoke-poster-${TS}@test.local`;
const runnerEmail = `smoke-runner-${TS}@test.local`;

let failures = 0;
function check(name: string, cond: boolean, extra?: unknown) {
  const ok = !!cond;
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra !== undefined ? `  → ${JSON.stringify(extra)}` : ""}`);
}

async function main() {
  const admin = new Client({ connectionString: process.env.DATABASE_URL });
  await admin.connect();

  const taskIds: string[] = [];
  const walletIds: string[] = [];
  const cleanup = async () => {
    try {
      await admin.query(`DELETE FROM notifications WHERE task_id = ANY($1) OR actor_id IN ($2, $3) OR user_id IN ($2, $3)`, [taskIds, posterId, runnerId]);
      const convs = await admin.query(`SELECT id FROM conversations WHERE task_id = ANY($1)`, [taskIds]);
      const convIds = convs.rows.map((r) => r.id);
      if (convIds.length > 0) {
        const hasMessages = await admin.query(
          `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') AS ok`,
        );
        if (hasMessages.rows[0].ok) {
          await admin.query(`DELETE FROM messages WHERE conversation_id = ANY($1)`, [convIds]);
        }
        await admin.query(`DELETE FROM conversations WHERE id = ANY($1)`, [convIds]);
      }
      await admin.query(`DELETE FROM tasks WHERE id = ANY($1)`, [taskIds]);
      if (walletIds.length > 0) {
        await admin.query(`DELETE FROM wallet_transactions WHERE wallet_id = ANY($1)`, [walletIds]);
        await admin.query(`DELETE FROM wallets WHERE id = ANY($1)`, [walletIds]);
      }
      await admin.query(`DELETE FROM users WHERE id IN ($1, $2)`, [posterId, runnerId]);
      console.log(`\n[Cleanup] deleted ${taskIds.length} tasks, ${convIds.length} conversations, ${walletIds.length} wallets`);
    } catch (e: any) {
      console.error("[Cleanup] partial failure:", e.message);
    }
  };

  try {
    // WHAT: Template-copy two throwaway users (all columns preserved)
    const userCols = (
      await admin.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND table_schema = 'public' ORDER BY ordinal_position`,
      )
    ).rows.map((r) => r.column_name);
    const tpl = await admin.query(`SELECT * FROM users WHERE id = $1`, [TEMPLATE_USER_ID]);
    if (tpl.rows.length === 0) throw new Error("Template user not found");
    const copyUser = (newId: string, email: string, name: string) => {
      const vals = { ...tpl.rows[0] };
      vals.id = newId;
      vals.email = email;
      vals.full_name = name;
      const colList = userCols.join(", ");
      const params = userCols.map((c) => vals[c]);
      const placeholders = userCols.map((_, i) => `$${i + 1}`).join(", ");
      return admin.query(`INSERT INTO users (${colList}) VALUES (${placeholders})`, params);
    };
    await copyUser(posterId, posterEmail, "Smoke Poster");
    await copyUser(runnerId, runnerEmail, "Smoke Runner");
    console.log("[Setup] throwaway users created");

    // WHAT: trg_new_user_setup auto-creates the wallet row on user insert —
    //       pick it up (fallback: create manually if the trigger didn't)
    const walletFor = async (userId: string) => {
      const existing = await admin.query(`SELECT id FROM wallets WHERE user_id = $1`, [userId]);
      if (existing.rows.length > 0) {
        walletIds.push(existing.rows[0].id);
        return existing.rows[0].id;
      }
      const r = await admin.query(
        `INSERT INTO wallets (user_id, balance, escrow, currency, is_frozen, pending_balance, pending_earnings, earnings)
         VALUES ($1, 0, 0, 'NGN', false, 0, 0, 0) RETURNING id`,
        [userId],
      );
      walletIds.push(r.rows[0].id);
      return r.rows[0].id;
    };
    await walletFor(posterId);
    await walletFor(runnerId);
    console.log("[Setup] wallets present for both users");

    // WHAT: Fund the poster — ₦50,000 spendable (covers all scenarios)
    await withTransaction(async (client) => {
      await creditWallet(client, posterId, 5_000_000, "manual_deposit_confirmed", "Smoke test funding", `smoke_fund_${TS}`);
    });
    console.log("[Setup] poster funded ₦50,000");

    const cat = await admin.query(`SELECT id FROM categories ORDER BY name LIMIT 1`);
    const categoryId = cat.rows[0].id;

    // ─── SCENARIO A: negotiate UP → awaiting_funding → fund (idempotent) ───
    console.log("\n── Scenario A: negotiate up + fund ──");
    const taskA = await createTask(posterId, {
      categoryId,
      title: `Smoke Negotiate Up ${TS}`,
      description: "Smoke test task — negotiate up and fund",
      budgetNaira: 3000,
      workMode: "on_site",
      locationLabel: "FUOYE Main Campus",
    });
    taskIds.push(taskA.id);
    check("A1: task created with budget ₦3000", Number(taskA.budget.kobo) === 300_000, taskA.budget);
    const escrowA = await admin.query(`SELECT escrow_amount_kobo, poster_id FROM tasks WHERE id = $1`, [taskA.id]);
    check("A2: escrow locked == budget (₦3000)", Number(escrowA.rows[0].escrow_amount_kobo) === 300_000, escrowA.rows[0]);

    const appA = await apply(runnerId, { taskId: taskA.id, message: "I can do this", proposedAmountNaira: 4500 });
    check("A3: application created", !!appA.id, { appId: appA.id });

    const proposalsA = await listProposals(taskA.id, posterId);
    check("A4: one pending proposal ₦4500 (diff +₦1500)",
      proposalsA.length === 1 && proposalsA[0].status === "pending" && proposalsA[0].proposedAmount.naira === 4500,
      proposalsA.map((p) => ({ status: p.status, proposed: p.proposedAmount.naira, diff: p.difference.naira })));

    const acceptedA = await acceptProposal(proposalsA[0].id, posterId);
    check("A5: accept → awaiting_funding, additional ₦1500",
      acceptedA.taskStatus === "awaiting_funding" && acceptedA.additionalFundingRequired.naira === 1500,
      { taskStatus: acceptedA.taskStatus, additional: acceptedA.additionalFundingRequired.naira });

    const taskAState = await admin.query(
      `SELECT status, escrow_amount_kobo, agreed_amount_kobo, assigned_to FROM tasks WHERE id = $1`, [taskA.id]);
    check("A6: task row awaiting_funding, agreed ₦4500, not hired",
      taskAState.rows[0].status === "awaiting_funding"
      && Number(taskAState.rows[0].agreed_amount_kobo) === 450_000
      && taskAState.rows[0].assigned_to === null, taskAState.rows[0]);

    const fundedA = await fundProposal(proposalsA[0].id, posterId);
    check("A7: fund → in_progress, escrow now ₦4500",
      fundedA.taskStatus === "in_progress" && fundedA.escrowAmount.naira === 4500,
      { taskStatus: fundedA.taskStatus, escrow: fundedA.escrowAmount.naira });

    const taskAAfter = await admin.query(
      `SELECT status, escrow_amount_kobo, assigned_to, runner_busy FROM tasks t JOIN users u ON u.id = t.assigned_to WHERE t.id = $1`, [taskA.id]);
    check("A8: hired, escrow == agreed",
      taskAAfter.rows[0].status === "in_progress" && Number(taskAAfter.rows[0].escrow_amount_kobo) === 450_000 && !!taskAAfter.rows[0].assigned_to,
      taskAAfter.rows[0]);

    const walletAPoster = await admin.query(`SELECT balance FROM wallets WHERE user_id = $1`, [posterId]);
    const balanceAfterFund = Number(walletAPoster.rows[0].balance);

    const fundAgain = await fundProposal(proposalsA[0].id, posterId);
    const walletAPoster2 = await admin.query(`SELECT balance FROM wallets WHERE user_id = $1`, [posterId]);
    const ledgerAgain = await admin.query(
      `SELECT reference FROM wallet_transactions WHERE task_id = $1 ORDER BY created_at`, [taskA.id]);
    check("A9: idempotent refund — second fund is a no-op (balance + ledger unchanged)",
      Number(walletAPoster2.rows[0].balance) === balanceAfterFund
        && ledgerAgain.rows.filter((r) => String(r.reference).startsWith("fund_")).length === 1,
      { alreadyFunded: fundAgain.alreadyFunded, before: balanceAfterFund, after: Number(walletAPoster2.rows[0].balance) });

    const ledgerA = await admin.query(
      `SELECT reference, amount, type FROM wallet_transactions WHERE task_id = $1 ORDER BY created_at`, [taskA.id]);
    check("A10: ledger has exactly one fund tx (no double lock)",
      ledgerA.rows.filter((r) => String(r.reference).startsWith("fund_")).length === 1,
      ledgerA.rows.map((r) => r.reference));

    // ─── SCENARIO B: negotiate DOWN → immediate hire, escrow untouched ───
    console.log("\n── Scenario B: negotiate down (immediate hire) ──");
    const taskB = await createTask(posterId, {
      categoryId,
      title: `Smoke Negotiate Down ${TS}`,
      description: "Smoke test task — lower offer hired immediately",
      budgetNaira: 3000,
      workMode: "remote",
      locationLabel: "Remote",
    });
    taskIds.push(taskB.id);
    await apply(runnerId, { taskId: taskB.id, message: "Cheaper", proposedAmountNaira: 2500 });
    const proposalsB = await listProposals(taskB.id, posterId);
    const acceptedB = await acceptProposal(proposalsB[0].id, posterId);
    check("B1: lower offer → immediate in_progress, no funding step",
      acceptedB.taskStatus === "in_progress" && acceptedB.additionalFundingRequired.naira === 0,
      { taskStatus: acceptedB.taskStatus });
    const taskBState = await admin.query(`SELECT status, escrow_amount_kobo FROM tasks WHERE id = $1`, [taskB.id]);
    check("B2: escrow stays at budget ₦3000 (excess refunds at settlement)",
      taskBState.rows[0].status === "in_progress" && Number(taskBState.rows[0].escrow_amount_kobo) === 300_000,
      taskBState.rows[0]);

    // ─── SCENARIO C: reject keeps task open ───
    console.log("\n── Scenario C: reject ──");
    const taskC = await createTask(posterId, {
      categoryId,
      title: `Smoke Reject ${TS}`,
      description: "Smoke test task — proposal gets rejected",
      budgetNaira: 3000,
      locationLabel: "FUOYE Main Campus",
    });
    taskIds.push(taskC.id);
    await apply(runnerId, { taskId: taskC.id, message: "Premium", proposedAmountNaira: 4000 });
    const proposalsC = await listProposals(taskC.id, posterId);
    const rejected = await rejectProposal(proposalsC[0].id, posterId);
    const taskCState = await admin.query(`SELECT status FROM tasks WHERE id = $1`, [taskC.id]);
    check("C1: reject → proposal rejected, task still open",
      rejected.status === "rejected" && taskCState.rows[0].status === "open", { proposal: rejected.status, task: taskCState.rows[0].status });

    // ─── SCENARIO D: cancel keeps task open ───
    console.log("\n── Scenario D: cancel ──");
    const taskD = await createTask(posterId, {
      categoryId,
      title: `Smoke Cancel ${TS}`,
      description: "Smoke test task — proposal gets cancelled",
      budgetNaira: 3000,
      locationLabel: "FUOYE Main Campus",
    });
    taskIds.push(taskD.id);
    await apply(runnerId, { taskId: taskD.id, message: "Changed mind", proposedAmountNaira: 4000 });
    const proposalsD = await listProposals(taskD.id, posterId);
    const cancelled = await cancelProposal(proposalsD[0].id, runnerId);
    const taskDState = await admin.query(`SELECT status FROM tasks WHERE id = $1`, [taskD.id]);
    check("D1: cancel → proposal cancelled, task still open",
      cancelled.status === "cancelled" && taskDState.rows[0].status === "open", { proposal: cancelled.status, task: taskDState.rows[0].status });

    // ─── SCENARIO E: guards ───
    console.log("\n── Scenario E: guards ──");
    const taskE = await createTask(posterId, {
      categoryId,
      title: `Smoke Guard ${TS}`,
      description: "Smoke test task — guard rails",
      budgetNaira: 3000,
      locationLabel: "FUOYE Main Campus",
    });
    taskIds.push(taskE.id);
    let guardErr: string | null = null;
    try {
      await apply(runnerId, { taskId: taskE.id, message: "First", proposedAmountNaira: 3500 });
    } catch (e: any) { guardErr = e.message; }
    let secondErr: string | null = null;
    try {
      await apply(runnerId, { taskId: taskE.id, message: "Second", proposedAmountNaira: 3800 });
    } catch (e: any) { secondErr = e.message; }
    check("E1: second proposal from same runner blocked", secondErr !== null, secondErr);

    let equalErr: string | null = null;
    try {
      await apply(runnerId, { taskId: taskE.id, message: "Same amount", proposedAmountNaira: 3000 });
    } catch (e: any) { equalErr = e.message; }
    check("E2: equal-to-budget proposal rejected as non-negotiation", equalErr !== null, equalErr);
    void guardErr;

    console.log(`\n[Smoke] ${failures === 0 ? "ALL PASSED" : `${failures} FAILURE(S)`}`);
  } catch (e: any) {
    failures++;
    console.error("[Smoke] FATAL:", e.message);
  } finally {
    await cleanup();
    await admin.end();
    await db.end();
    process.exit(failures === 0 ? 0 : 1);
  }
}

main();
