import Link from "next/link";
import AccountMenu from "@/app/components/AccountMenu";

type SidebarTabsProps = {
  displayName: string;
  activeTab: "welcome" | "bugs" | "captions" | "upload";
  children: React.ReactNode;
};

export default function SidebarTabs({
  displayName,
  activeTab,
  children,
}: SidebarTabsProps) {
  return (
    <div className="min-h-screen bg-black text-zinc-50">
      <aside className="fixed left-0 top-0 flex h-screen w-48 flex-col border-r border-zinc-900 bg-black px-6 pb-10 pt-12">
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
              href="/bug-reports"
              className={`block w-full rounded-full px-6 py-3 text-left text-sm font-semibold tracking-wide transition ${
                activeTab === "bugs"
                  ? "border border-zinc-700 bg-zinc-900 text-white shadow-[0_0_0_1px_rgba(63,63,70,0.6)]"
                  : "border border-zinc-800 bg-zinc-950 text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              Bug Reports
            </Link>
            <Link
              href="/captions"
              className={`block w-full rounded-full px-6 py-3 text-left text-sm font-semibold tracking-wide transition ${
                activeTab === "captions"
                  ? "border border-zinc-700 bg-zinc-900 text-white shadow-[0_0_0_1px_rgba(63,63,70,0.6)]"
                  : "border border-zinc-800 bg-zinc-950 text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              Captions
            </Link>
            <Link
              href="/upload"
              className={`block w-full rounded-full px-6 py-3 text-left text-sm font-semibold tracking-wide transition ${
                activeTab === "upload"
                  ? "border border-zinc-700 bg-zinc-900 text-white shadow-[0_0_0_1px_rgba(63,63,70,0.6)]"
                  : "border border-zinc-800 bg-zinc-950 text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              Upload
            </Link>
          </div>

          <div className="mt-auto pb-2 pt-10">
            <AccountMenu displayName={displayName} />
          </div>
        </aside>

        <main className="ml-48 px-12 pb-12 pt-12">{children}</main>
    </div>
  );
}
