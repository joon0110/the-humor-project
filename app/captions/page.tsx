import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import SidebarTabs from "@/app/components/SidebarTabs";

export const dynamic = "force-dynamic";

export default async function CaptionsPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  const email = data.user?.email ?? "";
  const displayName =
    data.user?.user_metadata?.full_name ??
    data.user?.user_metadata?.name ??
    email;
  const domain = email.split("@")[1] ?? "";
  const isAllowed =
    domain.toLowerCase() === "columbia.edu" ||
    domain.toLowerCase() === "barnard.edu";

  if (!data.user || !isAllowed) {
    if (data.user && !isAllowed) {
      await supabase.auth.signOut();
    }
    redirect("/login");
  }

  return (
    <SidebarTabs activeTab="captions" displayName={displayName}>
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Captions</h1>
          <p className="text-sm text-zinc-400">Live data from Supabase.</p>
        </header>
      </div>
    </SidebarTabs>
  );
}
