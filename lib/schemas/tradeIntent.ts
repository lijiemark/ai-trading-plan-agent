// Purpose: Zod schemas + lifecycle rules for trade intent create/update.

import { z } from "zod";

export const TradeIntentStatusSchema = z.enum([
  "draft",
  "planted",
  "closed",
  "canceled",
]);

export type TradeIntentStatus = z.infer<typeof TradeIntentStatusSchema>;

export const TradeSideSchema = z.enum(["long", "short"]);
export type TradeSide = z.infer<typeof TradeSideSchema>;

/** Allowed status transitions (server-enforced). */
export const ALLOWED_STATUS_TRANSITIONS: Record<
  TradeIntentStatus,
  readonly TradeIntentStatus[]
> = {
  draft: ["planted", "canceled"],
  planted: ["closed", "canceled"],
  closed: [],
  canceled: [],
} as const;

export function canTransitionStatus(
  from: TradeIntentStatus,
  to: TradeIntentStatus
): boolean {
  if (from === to) return true;
  return ALLOWED_STATUS_TRANSITIONS[from].includes(to);
}

/**
 * Validate entry / stop / take-profit ordering for a side.
 * Long: stop < entry < takeProfit
 * Short: takeProfit < entry < stop
 */
export function validatePriceLevels(input: {
  entry: number;
  stop: number;
  takeProfit: number;
  side: TradeSide;
}): { ok: true } | { ok: false; error: string } {
  const { entry, stop, takeProfit, side } = input;
  if (![entry, stop, takeProfit].every((n) => Number.isFinite(n))) {
    return { ok: false, error: "Prices must be finite numbers" };
  }
  if (side === "long") {
    if (!(stop < entry && entry < takeProfit)) {
      return {
        ok: false,
        error: "Long requires stop < entry < takeProfit",
      };
    }
  } else if (!(takeProfit < entry && entry < stop)) {
    return {
      ok: false,
      error: "Short requires takeProfit < entry < stop",
    };
  }
  return { ok: true };
}

/** Infer side when ordering is unambiguous; otherwise null. */
export function inferTradeSide(input: {
  entry: number;
  stop: number;
  takeProfit: number;
}): TradeSide | null {
  const longOk = validatePriceLevels({ ...input, side: "long" }).ok;
  const shortOk = validatePriceLevels({ ...input, side: "short" }).ok;
  if (longOk && !shortOk) return "long";
  if (shortOk && !longOk) return "short";
  return null;
}

const levelsRefine = <
  T extends { entry: number; stop: number; takeProfit: number; side?: TradeSide },
>(
  data: T,
  ctx: z.RefinementCtx
) => {
  const side = data.side ?? inferTradeSide(data);
  if (!side) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Ambiguous or invalid levels — provide side (long|short) with ordered stop/entry/takeProfit",
    });
    return;
  }
  const check = validatePriceLevels({ ...data, side });
  if (!check.ok) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: check.error });
  }
};

export const TradeIntentCreateSchema = z
  .object({
    entry: z.number().finite(),
    stop: z.number().finite(),
    takeProfit: z.number().finite(),
    side: TradeSideSchema.optional(),
    status: z.enum(["draft", "planted"]).default("draft"),
    sourcePlanId: z.string().uuid().nullable().optional(),
    notes: z.string().max(2000).nullable().optional(),
    /** Optional client key — reserved for future unique upsert; validated as uuid. */
    idempotencyKey: z.string().uuid().optional(),
  })
  .superRefine(levelsRefine);

export type TradeIntentCreate = z.infer<typeof TradeIntentCreateSchema>;

export const TradeIntentUpdateSchema = z
  .object({
    id: z.string().uuid(),
    entry: z.number().finite().optional(),
    stop: z.number().finite().optional(),
    takeProfit: z.number().finite().optional(),
    side: TradeSideSchema.optional(),
    status: TradeIntentStatusSchema.optional(),
    sourcePlanId: z.string().uuid().nullable().optional(),
    notes: z.string().max(2000).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    const hasLevels =
      data.entry !== undefined ||
      data.stop !== undefined ||
      data.takeProfit !== undefined;
    if (!hasLevels) return;
    if (
      data.entry === undefined ||
      data.stop === undefined ||
      data.takeProfit === undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "When updating levels, entry, stop, and takeProfit are all required",
      });
      return;
    }
    levelsRefine(
      {
        entry: data.entry,
        stop: data.stop,
        takeProfit: data.takeProfit,
        side: data.side,
      },
      ctx
    );
  });

export type TradeIntentUpdate = z.infer<typeof TradeIntentUpdateSchema>;
