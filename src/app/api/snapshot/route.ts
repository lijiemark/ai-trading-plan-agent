// Purpose: Market snapshot API endpoint.

import { NextResponse } from "next/server";

import { TTLCache } from "@/lib/cache/ttlCache";
import { DemoProvider } from "@/lib/providers";
import { buildSnapshot } from "@/lib/snapshot/buildSnapshot";
import { normalizeSymbol } from "@/lib/symbols/normalize";

const cache = new TTLCache<string, unknown>();
const CACHE_TTL_MS = 30_000;

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const symbolParam = url.searchParams.get("symbol");

  if (!symbolParam) {
    return NextResponse.json({ error: "Missing symbol" }, { status: 400 });
  }

  let normalized;
  try {
    normalized = normalizeSymbol(symbolParam);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unsupported symbol" },
      { status: 400 }
    );
  }

  const cacheKey = normalized.symbol;
  const cached = cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const provider = new DemoProvider();
    const snapshot = await buildSnapshot({
      provider,
      symbol: normalized.symbol,
    });

    cache.set(cacheKey, snapshot, CACHE_TTL_MS);

    if (process.env.NODE_ENV === "development") {
      console.info(
        JSON.stringify({
          event: "snapshot_generated",
          symbol: normalized.symbol,
          provider: provider.name,
          asOf: snapshot.asOf,
        })
      );
    }

    return NextResponse.json(snapshot);
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to build snapshot" },
      { status: 500 }
    );
  }
}

