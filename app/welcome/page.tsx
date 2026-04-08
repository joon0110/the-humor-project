import { createSupabaseServerClient } from "@/lib/supabase/server";
import SidebarTabs from "@/app/components/SidebarTabs";
import { getDisplayName } from "@/lib/auth/user-display";

export const dynamic = "force-dynamic";

export default async function WelcomePage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  const displayName = getDisplayName(data.user);

  return (
    <SidebarTabs activeTab="welcome" displayName={displayName}>
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] px-14 py-16 text-center shadow-sm">
          <h1 className="text-6xl font-semibold">
            Welcome to The Humor Project
          </h1>
          <p className="mt-5 text-3xl text-[var(--muted)]">
            Spring 2026 by Joon Ahn
          </p>
        </div>
      </div>
    </SidebarTabs>
  );
}
