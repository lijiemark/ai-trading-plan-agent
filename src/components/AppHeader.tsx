"use client";

import { AppNav } from "@/components/AppNav";
import { UserMenu } from "@/components/UserMenu";

export function AppHeader({ subtitle }: { subtitle: string }) {
  return (
    <header className="mb-10">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-1 w-12 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 shadow-lg shadow-cyan-500/50"></div>
          <h1 className="bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-4xl font-bold text-transparent">
            TraderPal
          </h1>
        </div>
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
          <AppNav />
          <UserMenu />
        </div>
      </div>
      <p className="ml-0 text-sm font-medium text-blue-200/80 sm:ml-[60px]">
        {subtitle}
      </p>
    </header>
  );
}
