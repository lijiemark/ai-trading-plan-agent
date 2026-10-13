"use client";

import { signOut, useSession } from "next-auth/react";
import { clearAllLocalWorkspaceStorage } from "@/components/TraderPalProvider";

export function UserMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="h-9 w-24 animate-pulse rounded-lg bg-white/10" aria-hidden />
    );
  }

  if (!session?.user) return null;

  const label = session.user.name || session.user.email || "Account";

  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <p className="max-w-[10rem] truncate text-xs font-semibold text-white">
          {label}
        </p>
        {session.user.email && session.user.name && (
          <p className="max-w-[10rem] truncate text-[10px] text-blue-200/70">
            {session.user.email}
          </p>
        )}
      </div>
      {session.user.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={session.user.image}
          alt=""
          className="h-9 w-9 rounded-full border border-white/30"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
          {label.slice(0, 1).toUpperCase()}
        </div>
      )}
      <button
        type="button"
        onClick={() => {
          clearAllLocalWorkspaceStorage();
          void signOut({ callbackUrl: "/login" });
        }}
        className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-blue-100 transition hover:bg-white/20 hover:text-white"
      >
        Log out
      </button>
    </div>
  );
}
