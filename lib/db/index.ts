// Purpose: Server-only Neon Postgres client via Drizzle (WebSocket Pool).
// Never import this module from client components or Edge middleware.

import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

neonConfig.webSocketConstructor = ws;

type Db = NeonDatabase<typeof schema>;

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Missing DATABASE_URL. Set it in .env.local (Neon pooled connection string)."
    );
  }
  return url;
}

const globalForDb = globalThis as unknown as {
  traderpalPool?: Pool;
  traderpalDb?: Db;
};

function getPool(): Pool {
  if (!globalForDb.traderpalPool) {
    globalForDb.traderpalPool = new Pool({
      connectionString: requireDatabaseUrl(),
    });
  }
  return globalForDb.traderpalPool;
}

export function getDb(): Db {
  if (!globalForDb.traderpalDb) {
    globalForDb.traderpalDb = drizzle(getPool(), { schema });
  }
  return globalForDb.traderpalDb;
}

/** Convenience alias for server routes that expect a ready client. */
export const db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});

export { schema };
