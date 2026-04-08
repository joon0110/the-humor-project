"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

type CaptionSort = "recent" | "likes";

type CaptionSortControlsProps = {
  sort: CaptionSort;
};

const SORT_LABELS: Record<CaptionSort, string> = {
  recent: "Sorted by most recent",
  likes: "Sorted by most likes",
};

export default function CaptionSortControls({
  sort,
}: CaptionSortControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleChange = (nextSort: CaptionSort) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", nextSort);

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label
        htmlFor="caption-sort"
        className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-strong)]"
      >
        Sort public feed
      </label>
      <select
        id="caption-sort"
        name="sort"
        value={sort}
        onChange={(event) => handleChange(event.target.value as CaptionSort)}
        disabled={isPending}
        className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] disabled:opacity-70"
      >
        <option value="recent">Most recent</option>
        <option value="likes">Most likes</option>
      </select>
      <span className="rounded-full border border-[var(--card-border-strong)] bg-[var(--card-alt)] px-3 py-1 text-xs font-medium text-[var(--success)]">
        {SORT_LABELS[sort]}
      </span>
    </div>
  );
}
