// WHAT: One-shot smoke test for the Runner Availability feature
// WHY:  Exercises create/list/deactivate + poster discovery against the live schema
// RUN:  cd needfull-backend && npx tsx scripts/test-availability.ts

process.env.SKIP_HTTP_LISTEN = "1";

import { randomBytes } from "node:crypto";
import db from "../src/config/db";
import {
  createAvailability,
  listMyAvailability,
  deactivateAvailability,
  listAvailability,
} from "../src/services/availability.service";

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
  // WHAT: Fresh runner + poster users (poster also acts as the discovering user)
  const runnerRes = await db.query<{ id: string }>(
    `INSERT INTO users
       (full_name, email, phone, password_hash, roles, active_role, email_verified_at,
        is_runner, is_available, trust_score, is_banned)
     VALUES ($1, $2, '0000000000', 'test-hash',
             ARRAY['runner'], 'runner', NOW(), true, true, 80, false)
     RETURNING id`,
    [`AvailRunner`, `it-${suffix}-availrunner@needfull.test`],
  );
  const runnerId = runnerRes.rows[0].id;
  idList.push(runnerId);

  const posterRes = await db.query<{ id: string }>(
    `INSERT INTO users
       (full_name, email, phone, password_hash, roles, active_role, email_verified_at,
        is_runner, is_available, trust_score, is_banned)
     VALUES ($1, $2, '0000000000', 'test-hash',
             ARRAY['poster'], 'poster', NOW(), false, false, 80, false)
     RETURNING id`,
    [`AvailPoster`, `it-${suffix}-availposter@needfull.test`],
  );
  const posterId = posterRes.rows[0].id;
  idList.push(posterId);

  const catRes = await db.query<{ id: string }>(
    `SELECT id FROM categories WHERE is_active = true ORDER BY sort_order LIMIT 1`,
  );
  ok(catRes.rows.length === 1, "active category exists for the offer");
  const categoryId = catRes.rows[0].id;

  // WHAT: Create an offer WITHOUT location (campus default) + one WITH location
  const noLoc = await createAvailability(runnerId, {
    categoryId,
    note: "Delivery runs around hostels",
    maxTravelKm: 2,
    availableUntil: new Date(Date.now() + 7 * 86400000).toISOString(),
    isOnlineToday: true,
  });
  ok(!!noLoc.id, "offer created without location");

  const withLoc = await createAvailability(runnerId, {
    categoryId,
    note: "Errands anywhere on campus",
    maxTravelKm: 10,
    isOnlineToday: false,
    lat: 7.76,
    lng: 5.21,
  });
  ok(!!withLoc.id, "offer created with location");

  // WHAT: mine lists both
  const mine = await listMyAvailability(runnerId);
  ok(mine.length === 2, "mine() returns both offers (got " + mine.length + ")");
  ok(mine.every((o) => o.category && o.category.name), "offers carry category info");
  ok(mine.some((o) => o.maxTravelKm === 2), "maxTravelKm round-trips (2)");
  ok(mine.some((o) => o.isOnlineToday === false), "isOnlineToday round-trips (false)");

  // WHAT: Poster discovery — with precise coords only located offers appear
  const nearby = await listAvailability({ lat: 7.75, lng: 5.2, radiusMeters: 20000 });
  const forRunner = nearby.filter((o) => o.runnerId === runnerId);
  ok(forRunner.length === 1, "precise-coords discovery shows only the located offer");
  ok(forRunner.some((o) => o.distance !== null), "distance computed when poster has coords");
  ok(forRunner[0]?.runner?.fullName === "AvailRunner", "discovery includes runner identity");

  // WHAT: Without coords, campus-default (location-less) offers are visible too
  const allOffers = await listAvailability({});
  const allForRunner = allOffers.filter((o) => o.runnerId === runnerId);
  ok(allForRunner.length === 2, "coords-free discovery shows both offers");

  // WHAT: Filter by category
  const byCat = await listAvailability({ categoryId });
  ok(byCat.length >= 2, "category filter returns offers");

  // WHAT: New discovery filters — search, onlineToday, perPage, enriched runner payload
  const searchHit = await listAvailability({ search: "Errands" });
  ok(searchHit.some((o) => o.runnerId === runnerId), "search matches offer note");
  const offToday = await listAvailability({ onlineToday: false });
  ok(offToday.some((o) => o.runnerId === runnerId && o.isOnlineToday === false), "onlineToday=false filter works");
  const onToday = await listAvailability({ onlineToday: true });
  ok(!onToday.some((o) => o.runnerId === runnerId && o.isOnlineToday === false), "onlineToday=true excludes offline offer");
  const paged = await listAvailability({ perPage: 1 });
  ok(paged.length === 1, "perPage limits results (got " + paged.length + ")");
  const enriched = await listAvailability({ runnerId });
  ok(typeof enriched[0]?.runner?.averageRating !== "undefined", "runner payload has averageRating");
  ok(typeof enriched[0]?.runner?.tasksCompleted !== "undefined", "runner payload has tasksCompleted");

  // WHAT: deactivate one — mine drops to 1, discovery no longer shows it
  ok(await deactivateAvailability(runnerId, noLoc.id), "deactivate offer (owner)");
  ok(!(await deactivateAvailability(posterId, noLoc.id)), "deactivate fails for non-owner");
  const mineAfter = await listMyAvailability(runnerId);
  ok(mineAfter.length === 1, "mine() drops to 1 after deactivate");
  const after = await listAvailability({ runnerId });
  ok(after.length === 1, "discovery drops to 1 after deactivate");

  // WHAT: Expired offer must not appear
  const expired = await createAvailability(runnerId, {
    categoryId,
    note: "already over",
    availableUntil: new Date(Date.now() - 86400000).toISOString(),
  });
  const mineFinal = await listMyAvailability(runnerId);
  ok(!mineFinal.some((o) => o.id === expired.id), "expired offer is hidden");

  // WHAT: A runner who is OFF must not be discoverable
  await db.query("UPDATE users SET is_available = false WHERE id = $1", [runnerId]);
  const offline = await listAvailability({});
  ok(!offline.some((o) => o.runnerId === runnerId), "offline runner's offers hidden");

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
  console.error("Smoke test failed:", err);
  await cleanup();
  process.exit(1);
});