// WHAT: One-shot smoke test for POST /tasks/:id/invite (inviteRunnerHandler)
// WHY:  Verifies the invite flow end-to-end against the live schema before deploy
// RUN:  cd needfull-backend && npx tsx scripts/test-invite.ts

process.env.SKIP_HTTP_LISTEN = "1";

import { randomBytes } from "node:crypto";
import db from "../src/config/db";
import { inviteRunnerHandler } from "../src/controllers/tasks.controller";

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

const suffix = randomBytes(4).toString("hex");
const idList: string[] = [];

async function main() {
  const posterRes = await db.query<{ id: string }>(
    `INSERT INTO users
       (full_name, email, phone, password_hash, roles, active_role, email_verified_at,
        is_runner, is_available, trust_score, is_banned)
     VALUES ($1, $2, '0000000000', 'test-hash',
             ARRAY['poster'], 'poster', NOW(), false, false, 80, false)
     RETURNING id`,
    [`InvPoster`, `it-${suffix}-invposter@needfull.test`],
  );
  const posterId = posterRes.rows[0].id;
  idList.push(posterId);

  const runnerRes = await db.query<{ id: string }>(
    `INSERT INTO users
       (full_name, email, phone, password_hash, roles, active_role, email_verified_at,
        is_runner, is_available, trust_score, is_banned)
     VALUES ($1, $2, '0000000000', 'test-hash',
             ARRAY['runner'], 'runner', NOW(), true, true, 80, false)
     RETURNING id`,
    [`InvRunner`, `it-${suffix}-invrunner@needfull.test`],
  );
  const runnerId = runnerRes.rows[0].id;
  idList.push(runnerId);

  const catRes = await db.query<{ id: string }>(
    `SELECT id FROM categories WHERE is_active = true ORDER BY sort_order LIMIT 1`,
  );
  const categoryId = catRes.rows[0].id;

  const taskRes = await db.query<{ id: string }>(
    `INSERT INTO tasks
       (id, poster_id, category_id, title, description, budget_kobo, status, created_at, updated_at)
     VALUES (gen_random_uuid(), $1, $2, 'Invite me please', 'A task to test invites', 50000, 'open', NOW(), NOW())
     RETURNING id`,
    [posterId, categoryId],
  );
  const taskId = taskRes.rows[0].id;

  const closedTaskRes = await db.query<{ id: string }>(
    `INSERT INTO tasks
       (id, poster_id, category_id, title, description, budget_kobo, status, created_at, updated_at)
     VALUES (gen_random_uuid(), $1, $2, 'Already done', 'A closed task', 50000, 'completed', NOW(), NOW())
     RETURNING id`,
    [posterId, categoryId],
  );
  const closedTaskId = closedTaskRes.rows[0].id;

  function mockRes() {
    const res: any = { statusCode: 200, body: null };
    res.status = (code: number) => { res.statusCode = code; return res; };
    res.json = (obj: any) => { res.body = obj; return res; };
    return res;
  }

  // 1. Happy path: poster invites runner to their open task
  const r1 = mockRes();
  await inviteRunnerHandler({ params: { taskId }, body: { runnerId }, user: { id: posterId } } as any, r1);
  ok(r1.statusCode === 200 && r1.body?.success === true, "happy path: invite succeeds");
  const notif = await db.query<any>(
    `SELECT * FROM notifications WHERE user_id = $1 AND task_id = $2 AND type = 'task_invite'`,
    [runnerId, taskId],
  );
  ok(notif.rows.length === 1, "runner received a task_invite notification");

  // 2. Not the poster's task → rejected
  const r2 = mockRes();
  await inviteRunnerHandler({ params: { taskId }, body: { runnerId }, user: { id: runnerId } } as any, r2);
  ok(r2.statusCode === 400, "non-owner cannot invite");

  // 3. Task not open → rejected
  const r3 = mockRes();
  await inviteRunnerHandler({ params: { taskId: closedTaskId }, body: { runnerId }, user: { id: posterId } } as any, r3);
  ok(r3.statusCode === 400, "closed task cannot receive invites");

  // 4. Unknown task → 404
  const r4 = mockRes();
  await inviteRunnerHandler({ params: { taskId: "00000000-0000-0000-0000-000000000000" }, body: { runnerId }, user: { id: posterId } } as any, r4);
  ok(r4.statusCode === 404, "unknown task returns 404");

  // 5. Unknown runner → rejected
  const r5 = mockRes();
  await inviteRunnerHandler({ params: { taskId }, body: { runnerId: "00000000-0000-0000-0000-000000000000" }, user: { id: posterId } } as any, r5);
  ok(r5.statusCode === 400, "unknown runner rejected");

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed ===`);
  await cleanup();
  process.exit(fail > 0 ? 1 : 0);
}

async function cleanup() {
  if (idList.length > 0) {
    await db.query("DELETE FROM users WHERE id = ANY($1)", [idList]);
  }
  await db.end();
}

main().catch(async (err) => {
  console.error("Invite smoke test failed:", err);
  await cleanup();
  process.exit(1);
});
