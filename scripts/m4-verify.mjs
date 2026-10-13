/**
 * S1-08 manual/automated smoke for M4.
 * - Unauthenticated private APIs → 401
 * - Neon tables present (user, plans, trade_intents, session)
 * - Limitations printed for Notion evidence
 *
 * Usage: node --env-file=.env.local scripts/m4-verify.mjs
 * Optional: BASE_URL=http://localhost:3000
 */

import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

const base = process.env.BASE_URL || "http://localhost:3000";
const failures = [];

function ok(label) {
  console.log(`PASS  ${label}`);
}
function fail(label, detail) {
  failures.push(`${label}: ${detail}`);
  console.error(`FAIL  ${label} — ${detail}`);
}

async function checkUnauthorized(path, init) {
  const res = await fetch(`${base}${path}`, init);
  if (res.status === 401) {
    ok(`401 ${init?.method || "GET"} ${path}`);
  } else {
    fail(`401 ${path}`, `got ${res.status}`);
  }
}

console.log("=== M4 verify ===");
console.log(`BASE_URL=${base}`);

try {
  await checkUnauthorized("/api/workspace");
  await checkUnauthorized("/api/snapshot?symbol=MES");
  await checkUnauthorized("/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol: "MES" }),
  });
  await checkUnauthorized("/api/trade-intents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      entry: 1,
      stop: 0.5,
      takeProfit: 2,
      status: "draft",
    }),
  });
  await checkUnauthorized("/api/trade-intents", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: "550e8400-e29b-41d4-a716-446655440000",
      status: "canceled",
    }),
  });
} catch (err) {
  fail("API reachability", err instanceof Error ? err.message : String(err));
}

const url = process.env.DATABASE_URL;
if (!url) {
  fail("DATABASE_URL", "missing — skip schema check");
} else {
  try {
    const sql = neon(url);
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('user', 'plans', 'trade_intents', 'session', 'account')
      ORDER BY table_name
    `;
    const names = tables.map((r) => r.table_name);
    for (const t of ["account", "plans", "session", "trade_intents", "user"]) {
      if (names.includes(t)) ok(`table ${t}`);
      else fail(`table ${t}`, "missing");
    }
  } catch (err) {
    fail("schema check", err instanceof Error ? err.message : String(err));
  }
}

console.log("\n--- Limitations (record in S1-08) ---");
console.log(
  "- Cross-device restore requires a real second browser/profile; automated tests cover DB ownership + per-user sessionStorage keys, not full Google OAuth UI."
);
console.log(
  "- Anonymous API 401s verified without a session cookie; authenticated happy-path stays a manual check while signed in."
);
console.log(
  "- Vitest isolation suite needs DATABASE_URL; skipped in environments without Neon secrets."
);

if (failures.length) {
  console.error(`\nm4_verify_fail (${failures.length})`);
  process.exit(1);
}
console.log("\nm4_verify_ok");
