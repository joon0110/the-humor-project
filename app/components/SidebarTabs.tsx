"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type SidebarTabsProps = {
  displayName: string;
  activeTab: "welcome" | "bugs";
  children: React.ReactNode;
};

export default function SidebarTabs({
  displayName,
  activeTab,
  children,
}: SidebarTabsProps) {
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const formattedName = useMemo(() => {
    const trimmed = displayName.trim();
    return trimmed.length > 0 ? trimmed : "Account";
  }, [displayName]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-black text-zinc-50">
      <aside className="fixed left-0 top-0 flex h-screen w-72 flex-col border-r border-zinc-900 bg-black px-8 pb-10 pt-12">
          <div className="space-y-3">
            <Link
              href="/welcome"
              className={`block w-full rounded-full px-6 py-3 text-left text-sm font-semibold tracking-wide transition ${
                activeTab === "welcome"
                  ? "border border-zinc-700 bg-zinc-900 text-white shadow-[0_0_0_1px_rgba(63,63,70,0.6)]"
                  : "border border-zinc-800 bg-zinc-950 text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              Welcome
            </Link>
            <Link
              href="/bugreports"
              className={`block w-full rounded-full px-6 py-3 text-left text-sm font-semibold tracking-wide transition ${
                activeTab === "bugs"
                  ? "border border-zinc-700 bg-zinc-900 text-white shadow-[0_0_0_1px_rgba(63,63,70,0.6)]"
                  : "border border-zinc-800 bg-zinc-950 text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              Bug Reports
            </Link>
          </div>

          <div className="mt-auto pb-2 pt-10">
            <div className="relative">
              {isAccountOpen && (
                <div className="absolute -top-14 left-0 w-full rounded-2xl border border-zinc-800 bg-zinc-950/95 p-3 shadow-lg">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSigningOut ? "Signing out..." : "Sign out"}
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={() => setIsAccountOpen((open) => !open)}
                className="flex w-full items-center justify-between rounded-[28px] border border-zinc-800 bg-zinc-950 px-5 py-4 text-left shadow-[0_12px_24px_rgba(0,0,0,0.35)]"
              >
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-zinc-400">
                    Account
                  </div>
                  <div className="mt-1 text-base font-semibold text-white">
                    {formattedName}
                  </div>
                </div>
                <div className="text-2xl text-zinc-400">&rsaquo;</div>
              </button>
            </div>
          </div>
        </aside>

        <main className="ml-72 px-12 pb-12 pt-12">{children}</main>
    </div>
  );
}
