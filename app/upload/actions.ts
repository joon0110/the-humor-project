"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SetCaptionsPublicResult =
  | { ok: true; updatedCount: number }
  | { ok: false; error: string };

export async function setCaptionsPublic(
  captionIds: string[],
  isPublic: boolean
): Promise<SetCaptionsPublicResult> {
  if (!captionIds.length) {
    return { ok: true, updatedCount: 0 };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error: userError } = await supabase.auth.getUser();

  if (userError || !data.user) {
    return { ok: false, error: "AUTH_REQUIRED" };
  }

  const uniqueIds = Array.from(new Set(captionIds));
  const timestamp = new Date().toISOString();
  const { data: updatedRows, error } = await supabase
    .from("captions")
    .update({ is_public: isPublic, modified_datetime_utc: timestamp })
    .in("id", uniqueIds)
    .eq("profile_id", data.user.id)
    .select("id");

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, updatedCount: updatedRows?.length ?? 0 };
}
