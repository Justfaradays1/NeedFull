// WHAT: Repair wallet_transactions rows corrupted by string concatenation
//       (balance_before::text || amount::text) instead of real addition.
// WHY:  pg returns bigint as string; old code did balanceBefore + amountKobo in
//       JS, producing rows like before=10000, amt=90000, after=1000090000.
// HOW:  cd needfull-backend && npx tsx scripts/repair-ledger.ts

import db from "../src/config/db";

async function main() {
  const bad = await db.query<{ id: string; type: string; balance_before: string; amount: string; balance_after: string }>(
    `SELECT id, type, balance_before, amount, balance_after
     FROM wallet_transactions
     WHERE balance_after IS NOT NULL
       AND balance_before IS NOT NULL
       AND amount IS NOT NULL
       AND balance_after::text = balance_before::text || amount::text
     ORDER BY created_at`,
  );

  console.log(`Corrupted (string-concat) rows found: ${bad.rows.length}`);
  for (const r of bad.rows) {
    console.log(`  ${r.type}: before=${r.balance_before} amt=${r.amount} stored_after=${r.balance_after} → correct=${Number(r.balance_before) + Number(r.amount)}`);
  }

  const res = await db.query(
    `UPDATE wallet_transactions
     SET balance_after = balance_before + amount
     WHERE balance_after IS NOT NULL
       AND balance_before IS NOT NULL
       AND amount IS NOT NULL
       AND balance_after::text = balance_before::text || amount::text`,
  );
  console.log(`Fixed ${res.rowCount} row(s).`);

  const remaining = await db.query(
    `SELECT COUNT(*)::int AS n
     FROM wallet_transactions
     WHERE balance_after::text = balance_before::text || amount::text`,
  );
  console.log(`Remaining corrupted rows: ${remaining.rows[0].n}`);
  await db.end();
}

main().catch(async (e) => {
  console.error(e);
  await db.end();
  process.exit(1);
});