// WHAT: One-off migration runner — applies migrations/022_budget_proposals.sql
// WHY: Adds the wallet-transaction idempotency + single-review unique indexes
//      that the negotiation feature relies on (guard against double-credit
//      and duplicate ratings). Fully idempotent — safe to re-run.
// USAGE: npx tsx scripts/apply-022.ts

import fs from "fs";
import path from "path";
import "dotenv/config";
import { Client } from "pg";

async function main() {
  const sql = fs.readFileSync(
    path.join(__dirname, "..", "migrations", "022_budget_proposals.sql"),
    "utf8",
  );

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    console.log("[Migration 022] Applying...");
    await client.query(sql);
    console.log("[Migration 022] Applied successfully.");

    const check = await client.query(
      `SELECT indexname FROM pg_indexes
       WHERE indexname IN ('uq_wallet_transactions_idempotency','uq_reviews_reviewer_task')
       ORDER BY indexname`,
    );
    console.log(
      "[Migration 022] Unique indexes present:",
      check.rows.map((r) => r.indexname).join(", ") || "(none)",
    );
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("[Migration 022] Failed:", err.message);
  process.exit(1);
});
