// WHAT: Introspect live schema for tables needed by the integration test.
// WHY:  Build correct INSERT statements without guessing NOT NULL columns.

import db from "../src/config/db";

const tables = [
  "users",
  "wallets",
  "tasks",
  "categories",
  "task_applications",
  "wallet_transactions",
  "withdrawal_requests",
  "notifications",
];

async function main() {
  for (const t of tables) {
    const res = await db.query(
      `SELECT column_name, data_type, is_nullable, column_default
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1
       ORDER BY ordinal_position`,
      [t],
    );
    console.log(`\n=== ${t} ===`);
    for (const r of res.rows) {
      console.log(
        `${r.column_name}  ${r.data_type}  null=${r.is_nullable}  def=${r.column_default ?? "-"}`,
      );
    }
  }
  await db.end();
}

main().catch(async (e) => {
  console.error(e);
  await db.end();
  process.exit(1);
});