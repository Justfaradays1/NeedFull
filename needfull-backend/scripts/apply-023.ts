// WHAT: One-off migration runner — applies migrations/023_budget_negotiation_complete.sql
// WHY: Migrations are applied manually in Supabase; this lets dev apply the
//      negotiation schema to the local/connected database directly.
// USAGE: npx tsx scripts/apply-023.ts

import fs from "fs";
import path from "path";
import "dotenv/config";
import { Client } from "pg";

async function main() {
  const sql = fs.readFileSync(
    path.join(__dirname, "..", "migrations", "023_budget_negotiation_complete.sql"),
    "utf8",
  );

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    console.log("[Migration 023] Applying...");
    await client.query(sql);
    console.log("[Migration 023] Applied successfully.");

    // WHAT: Verify the columns now exist
    const check = await client.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_name IN ('tasks', 'task_applications', 'task_budget_proposals')
         AND column_name IN ('escrow_amount_kobo', 'agreed_amount_kobo',
                             'counter_amount_kobo', 'is_counter_offer', 'accepted_year')
       ORDER BY table_name, column_name`,
    );
    console.log("[Migration 023] Columns present:", check.rows.map((r) => r.column_name).join(", "));
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("[Migration 023] Failed:", err.message);
  process.exit(1);
});