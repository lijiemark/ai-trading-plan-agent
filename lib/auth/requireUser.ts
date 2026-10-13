// Purpose: Server-side auth gate — never trust client-supplied user ids.

import { NextResponse } from "next/server";
import { auth } from "@/auth";

export type AuthedUser = {
  id: string;
  email?: string | null;
  name?: string | null;
};

/**
 * Require an authenticated session with a stable user id.
 * Returns the user or a 401 NextResponse — caller must short-circuit on Response.
 */
export async function requireUser(): Promise<
  AuthedUser | NextResponse
> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return {
    id,
    email: session.user?.email,
    name: session.user?.name,
  };
}

export function isUnauthorized(
  value: AuthedUser | NextResponse
): value is NextResponse {
  return value instanceof NextResponse;
}
