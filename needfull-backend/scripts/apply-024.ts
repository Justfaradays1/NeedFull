// WHAT: One-off migration runner — applies migrations/024_task_status_awaiting_funding.sql
// WHY: ALTER TYPE ADD VALUE cannot run inside a transaction; this connects
//      directly and applies it standalone.
// USAGE: npx tsx scripts/apply-024.ts

import fs from "fs";
import path from "path";
import "dotenv/config";
import { Client } from "pg";

async function main() {
  const sql = fs.readFileSync(
    path.join(__dirname, "..", "migrations", "024_task_status_awaiting_funding.sql"),
    "utf8",
  );

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    console.log("[Migration 024] Applying...");
    await client.query(sql);
    console.log("[Migration 024] Applied successfully.");

    const check = await client.query(
      `SELECT enumlabel FROM pg_enum WHERE enumtypid = 'task_status'::regtype ORDER BY enumsortorder`,
    );
    console.log(
      "[Migration 024] task_status values:",
      check.rows.map((r) => r.enumlabel).join(", "),
    );
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("[Migration 024] Failed:", err.message);
  process.exit(1);
});