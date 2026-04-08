import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import SidebarTabs from "@/app/components/SidebarTabs";
import { getDisplayName } from "@/lib/auth/user-display";
import type { Caption } from "./types";
import CaptionList from "./CaptionList";
import CaptionSortControls from "./CaptionSortControls";

export const dynamic = "force-dynamic";

type CaptionSort = "recent" | "likes";

const fetchCaptions = cache(async (sort: CaptionSort) => {
  const supabase = await createSupabaseServerClient();
  const selectFields =
    "id, content, like_count, image:images!inner ( id, url, image_description )" as const;
  let query = supabase.from("captions").select(selectFields).returns<Caption[]>();

  if (sort === "likes") {
    query = query
      .order("like_count", { ascending: false })
      .order("created_datetime_utc", { ascending: false })
      .order("id", { ascending: false });
  } else {
    query = query
      .order("created_datetime_utc", { ascending: false })
      .order("id", { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
});

type CaptionsPageProps = {
  searchParams?: Promise<{
    sort?: string;
  }>;
};

export default async function CaptionsPage({
  searchParams,
}: CaptionsPageProps) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  const displayName = getDisplayName(data.user);
  const canVote = Boolean(data.user);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const sort: CaptionSort =
    resolvedSearchParams?.sort === "likes" ? "likes" : "recent";
  let captions: Caption[] = [];
  let errorMessage: string | null = null;

  try {
    captions = await fetchCaptions(sort);
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unknown error";
  }

  return (
    <SidebarTabs activeTab="captions" displayName={displayName}>
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            Public Caption Feed
          </h1>
          <p className="max-w-3xl text-sm text-[var(--muted)]">
            Browse captions saved publicly from the generator, then sort them by
            recency or by likes.
          </p>
          <CaptionSortControls sort={sort} />
        </header>

        <div className="pr-2">
          {errorMessage ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-[var(--danger)]">
              Failed to load captions: {errorMessage}
            </div>
          ) : captions.length === 0 ? (
            <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-4 text-sm text-[var(--muted)]">
              No captions yet.
            </div>
          ) : (
            <CaptionList captions={captions} canVote={canVote} />
          )}
        </div>
      </div>
    </SidebarTabs>
  );
}
