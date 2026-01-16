// Purpose: Normalize supported symbols for snapshot requests.

export type SupportedSymbol = "MES";

export function normalizeSymbol(input: string): {
  symbol: SupportedSymbol;
  display: string;
} {
  const trimmed = input.trim().toUpperCase();
  if (trimmed === "MES") {
    return { symbol: "MES", display: "MES" };
  }

  throw new Error(`Unsupported symbol: ${input}`);
}

