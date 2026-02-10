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
      <div className="rounded-2xl border border-zinc-900 bg-zinc-950/80 p-8 text-2xl font-semibold">
        Welcome
      </div>
    </SidebarTabs>
  );
}
