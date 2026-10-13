import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });
config(); // fallback .env if present

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    "Set DATABASE_URL (or DIRECT_URL for migrations) in .env.local before running drizzle-kit."
  );
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url,
  },
});
