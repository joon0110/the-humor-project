"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CaptionVoteResult =
  | { ok: true }
  | { ok: false; error: string };

export type CaptionVoteInsertResult =
  | { ok: true; id: number }
  | { ok: false; error: string };

type CaptionVoteInput = {
  captionId: string;
  voteValue: 1 | -1;
};

export async function createCaptionVote({
  captionId,
  voteValue,
}: CaptionVoteInput): Promise<CaptionVoteInsertResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error: userError } = await supabase.auth.getUser();

  if (userError || !data.user) {
    return { ok: false, error: "AUTH_REQUIRED" };
  }

  const timestamp = new Date().toISOString();
  const { data: voteRow, error } = await supabase
    .from("caption_votes")
    .insert({
    caption_id: captionId,
    vote_value: voteValue,
    profile_id: data.user.id,
    created_datetime_utc: timestamp,
    modified_datetime_utc: timestamp,
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, id: voteRow.id };
}

export async function deleteCaptionVote(voteId: number): Promise<CaptionVoteResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error: userError } = await supabase.auth.getUser();

  if (userError || !data.user) {
    return { ok: false, error: "AUTH_REQUIRED" };
  }

  const { error } = await supabase
    .from("caption_votes")
    .delete()
    .eq("id", voteId)
    .eq("profile_id", data.user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
