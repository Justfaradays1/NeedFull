import { readFileSync } from "node:fs";
import db from "../src/config/db";
import { resolveAccountNumber } from "../src/services/paystack.service";

async function main() {
  const sql = readFileSync("migrations/020_bank_resolve_cache.sql", "utf8");
  await db.query(sql);
  console.log("migration applied");

  const migrated = await db.query("SELECT to_regclass('public.bank_account_cache') AS t");
  console.log("cache table exists:", String(migrated.rows[0]?.t ?? "missing") !== "missing");

  const r1 = await resolveAccountNumber("0000000000", "001");
  console.log("R1 fresh:", JSON.stringify(r1));
  const r2 = await resolveAccountNumber("0000000000", "001");
  console.log("R2 cached:", JSON.stringify(r2));
  const r3 = await resolveAccountNumber("0283217171", "035");
  console.log("R3 wema:", JSON.stringify(r3).slice(0, 220));
}

main()
  .catch((e) => {
    console.error("FAIL:", e.message);
    process.exit(1);
  })
  .finally(() => db.end());