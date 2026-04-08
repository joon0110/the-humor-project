import Link from "next/link";
import AccountMenu from "@/app/components/AccountMenu";
import ThemeToggle from "@/app/components/ThemeToggle";

type SidebarTabsProps = {
  displayName: string;
  activeTab: "welcome" | "captions" | "upload";
  children: React.ReactNode;
};

export default function SidebarTabs({
  displayName,
  activeTab,
  children,
}: SidebarTabsProps) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <aside className="fixed left-0 top-0 flex h-screen w-56 flex-col border-r border-[var(--card-border)] bg-[var(--sidebar)] px-6 pb-10 pt-12">
          <div className="space-y-3">
            <Link
              href="/welcome"
              className={`block w-full rounded-full px-6 py-3 text-left text-sm font-semibold tracking-wide transition ${
                activeTab === "welcome"
                  ? "border border-[var(--card-border-strong)] bg-[var(--card-alt)] text-[var(--foreground)] shadow-[0_0_0_1px_rgba(63,63,70,0.35)]"
                  : "border border-[var(--card-border)] bg-[var(--card)] text-[var(--muted)] hover:bg-[var(--card-alt)]"
              }`}
            >
              Welcome
            </Link>
            <Link
              href="/captions"
              className={`block w-full rounded-full px-6 py-3 text-left text-sm font-semibold tracking-wide transition ${
                activeTab === "captions"
                  ? "border border-[var(--card-border-strong)] bg-[var(--card-alt)] text-[var(--foreground)] shadow-[0_0_0_1px_rgba(63,63,70,0.35)]"
                  : "border border-[var(--card-border)] bg-[var(--card)] text-[var(--muted)] hover:bg-[var(--card-alt)]"
              }`}
            >
              Captions
            </Link>
            <Link
              href="/upload"
              className={`block w-full rounded-full px-6 py-3 text-left text-sm font-semibold tracking-wide transition ${
                activeTab === "upload"
                  ? "border border-[var(--card-border-strong)] bg-[var(--card-alt)] text-[var(--foreground)] shadow-[0_0_0_1px_rgba(63,63,70,0.35)]"
                  : "border border-[var(--card-border)] bg-[var(--card)] text-[var(--muted)] hover:bg-[var(--card-alt)]"
              }`}
            >
              Upload
            </Link>
          </div>

          <div className="mt-auto space-y-3 pb-2 pt-10">
            <ThemeToggle />
            <AccountMenu displayName={displayName} />
          </div>
        </aside>

        <main className="ml-56 px-12 pb-12 pt-12">{children}</main>
    </div>
  );
}
