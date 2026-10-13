// Purpose: Drizzle schema — Auth.js identity tables + Plan/Trade domain tables.

import type { AdapterAccountType } from "next-auth/adapters";
import {
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/** Bootstrap metadata from M1 */
export const appMeta = pgTable("app_meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/** Auth.js user identity (not a brokerage account). */
export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  /** Reserved for future credentials login; unused for Google-only MVP. */
  passwordHash: text("passwordHash"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
    index("account_user_id_idx").on(account.userId),
  ]
);

/** Database-backed sessions enable server-side revocation. */
export const sessions = pgTable(
  "session",
  {
    sessionToken: text("sessionToken").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (session) => [index("session_user_id_idx").on(session.userId)]
);

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => [
    primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  ]
);

/** AI-generated trading plan history (planning artifact). */
export const plans = pgTable(
  "plans",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    symbol: text("symbol").notNull(),
    mode: text("mode"),
    scenario: text("scenario"),
    decision: text("decision").notNull(),
    planJson: jsonb("plan_json").notNull(),
    reportJson: jsonb("report_json"),
    snapshotJson: jsonb("snapshot_json"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("plans_user_id_idx").on(table.userId),
    index("plans_user_created_idx").on(table.userId, table.createdAt),
  ]
);

/**
 * Planted trade levels — planning intents only, NOT broker orders/fills.
 * Status: draft | planted | closed | canceled
 */
export const tradeIntents = pgTable(
  "trade_intents",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sourcePlanId: text("source_plan_id").references(() => plans.id, {
      onDelete: "set null",
    }),
    entry: doublePrecision("entry").notNull(),
    stop: doublePrecision("stop").notNull(),
    takeProfit: doublePrecision("take_profit").notNull(),
    status: text("status").notNull().default("draft"),
    plantedAt: timestamp("planted_at", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("trade_intents_user_id_idx").on(table.userId),
    index("trade_intents_user_status_idx").on(table.userId, table.status),
  ]
);

export type User = typeof users.$inferSelect;
export type PlanRow = typeof plans.$inferSelect;
export type TradeIntentRow = typeof tradeIntents.$inferSelect;
