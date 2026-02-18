import { createSupabaseServerClient } from "@/lib/supabase/server";
import SidebarTabs from "@/app/components/SidebarTabs";
import { getDisplayName } from "@/lib/auth/user-display";
import UploadClient from "./UploadClient";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  const displayName = getDisplayName(data.user);

  return (
    <SidebarTabs activeTab="upload" displayName={displayName}>
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Upload</h1>
          <p className="text-sm text-zinc-400">
            Upload an image and generate captions via the pipeline.
          </p>
        </header>

        <UploadClient />
      </div>
    </SidebarTabs>
  );
}
