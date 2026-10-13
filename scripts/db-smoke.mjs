import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const sql = neon(url);
await sql`
  INSERT INTO app_meta (key, value)
  VALUES ('schema_bootstrap', 'm1')
  ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value, updated_at = now()
`;
const rows = await sql`
  SELECT key, value FROM app_meta WHERE key = 'schema_bootstrap'
`;

if (rows[0]?.key !== "schema_bootstrap" || rows[0]?.value !== "m1") {
  console.error("smoke_fail", rows);
  process.exit(1);
}

console.log("smoke_ok");
