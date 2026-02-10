import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import SidebarTabs from "@/app/components/SidebarTabs";

export const dynamic = "force-dynamic";

export default async function WelcomePage() {
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
    <SidebarTabs activeTab="welcome" displayName={displayName}>
      <div className="rounded-2xl border border-zinc-900 bg-zinc-950/80 p-8 text-2xl font-semibold">
        Welcome
      </div>
    </SidebarTabs>
  );
}
