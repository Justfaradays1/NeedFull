// WHAT: Apply the pending schema migrations (014, 015) to the configured DB
// WHY: Columns required by the runner-earnings and runner-busy work are not
//      yet present in the database. Both statements use IF NOT EXISTS.
// RUN:  npx tsx scripts/apply-migrations.ts

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import db from "../src/config/db";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "..", "migrations");

async function main() {
  const migrations = [
    "012_runner_done_at.sql",
    "013_manual_transfers_fix.sql",
    "014_runner_earnings.sql",
    "015_runner_busy.sql",
    "016_task_applications_runner_id.sql",
    "017_wallet_tx_enum.sql",
  ];
  for (const file of migrations) {
    const sql = await readFile(join(migrationsDir, file), "utf8");
    console.log(`Applying ${file} …`);
    await db.query(sql);
    console.log(`  ✓ ${file} applied`);
  }
  await db.end();
  console.log("Migrations complete.");
}

main().catch(async (err) => {
  console.error("Migration failed:", err);
  await db.end();
  process.exit(1);
});