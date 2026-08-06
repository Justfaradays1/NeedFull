// WHAT: Inspect live columns for reviews, reports, users.metadata
import db from "../src/config/db";

async function main() {
  for (const t of ["reviews", "reports"]) {
    const res = await db.query(
      `SELECT column_name, data_type, is_nullable FROM information_schema.columns
       WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`,
      [t],
    );
    console.log(`\n=== ${t} ===`);
    for (const r of res.rows) console.log(`${r.column_name} ${r.data_type} null=${r.is_nullable}`);
  }
  const m = await db.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema='public' AND table_name='users' AND column_name='metadata'`,
  );
  console.log("\nusers.metadata exists:", m.rows.length > 0);
  await db.end();
}
main().catch((e) => { console.error(e); process.exit(1); });