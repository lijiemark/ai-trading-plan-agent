"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { TraderPalProvider } from "@/components/TraderPalProvider";

/**
 * Remount workspace provider when the auth user changes so account switches
 * reset state without sync setState-in-effect (lint-safe isolation).
 */
function TraderPalSessionBridge({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const workspaceKey =
    status === "loading" ? "loading" : (session?.user?.id ?? "anon");

  return (
    <TraderPalProvider key={workspaceKey}>{children}</TraderPalProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TraderPalSessionBridge>{children}</TraderPalSessionBridge>
    </SessionProvider>
  );
}
