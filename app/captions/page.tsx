import { createSupabaseServerClient } from "@/lib/supabase/server";
import SidebarTabs from "@/app/components/SidebarTabs";
import { getDisplayName } from "@/lib/auth/user-display";

export const dynamic = "force-dynamic";

type Caption = {
  id: string;
  content: string | null;
  created_datetime_utc: string;
  like_count: number;
  image: {
    id: string;
    url: string | null;
    image_description: string | null;
  };
};

type CaptionSort = "recent" | "likes";

function formatDateTime(value: string) {
  return new Date(value).toISOString();
}

async function fetchCaptions(sort: CaptionSort) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("captions")
    .select(
      [
        "id",
        "content",
        "created_datetime_utc",
        "like_count",
        "image:images!inner ( id, url, image_description )",
      ].join(", "),
    );

  if (sort === "likes") {
    query = query
      .order("like_count", { ascending: false })
      .order("created_datetime_utc", { ascending: false });
  } else {
    query = query.order("created_datetime_utc", { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Caption[];
}

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
          <h1 className="text-3xl font-semibold tracking-tight">Captions</h1>
          <p className="text-sm text-zinc-400">Live data from Supabase.</p>
          <form className="flex flex-wrap items-center gap-3" method="get">
            <label
              htmlFor="caption-sort"
              className="text-xs font-semibold uppercase tracking-wide text-zinc-500"
            >
              Filter
            </label>
            <select
              id="caption-sort"
              name="sort"
              defaultValue={sort}
              className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200"
            >
              <option value="recent">Most recent</option>
              <option value="likes">Most likes</option>
            </select>
            <button
              type="submit"
              className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-200"
            >
              Apply
            </button>
          </form>
        </header>

        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto pr-2">
          {errorMessage ? (
            <div className="rounded-lg border border-red-900/40 bg-red-950/40 p-4 text-sm text-red-200">
              Failed to load captions: {errorMessage}
            </div>
          ) : captions.length === 0 ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-400">
              No captions yet.
            </div>
          ) : (
            <ul className="space-y-4">
              {captions.map((caption) => (
                <li
                  key={caption.id}
                  className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <div className="aspect-[4/3] w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 sm:w-56">
                      {caption.image?.url ? (
                        <img
                          src={caption.image.url}
                          alt={
                            caption.image.image_description ?? "Caption image"
                          }
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs uppercase tracking-wide text-zinc-500">
                          No image
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <h2 className="text-lg font-semibold">
                        {caption.content ?? "Untitled caption"}
                      </h2>
                      <p className="mt-2 text-sm text-zinc-300">
                        Likes: {caption.like_count}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </SidebarTabs>
  );
}
