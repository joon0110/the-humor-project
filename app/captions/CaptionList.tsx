"use client";

import { useState } from "react";
import type { Caption } from "./types";
import { createCaptionVote, deleteCaptionVote } from "./actions";

type VoteDirection = "up" | "down";
type VoteState = "up" | "down" | "none";

type CaptionVotes = Record<
  string,
  { vote: VoteState; count: number; voteId: number | null }
>;

type VoteFeedback = {
  tone: "positive" | "neutral";
  message: string;
};

type CaptionListProps = {
  captions: Caption[];
  canVote: boolean;
};

export default function CaptionList({ captions, canVote }: CaptionListProps) {
  const [visibleCount, setVisibleCount] = useState(8);
  const [votes, setVotes] = useState<CaptionVotes>(() => {
    const initialVotes: CaptionVotes = {};
    for (const caption of captions) {
      initialVotes[caption.id] = {
        vote: "none",
        count: caption.like_count,
        voteId: null,
      };
    }
    return initialVotes;
  });
  const [pendingVotes, setPendingVotes] = useState<Record<string, boolean>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [voteFeedback, setVoteFeedback] = useState<Record<string, VoteFeedback>>(
    {}
  );

  const applyVote = (
    current: { vote: VoteState; count: number },
    direction: VoteDirection
  ) => {
    let { vote, count } = current;

    if (direction === "up") {
      if (vote === "up") {
        vote = "none";
        count -= 1;
      } else if (vote === "down") {
        vote = "up";
        count += 2;
      } else {
        vote = "up";
        count += 1;
      }
    } else {
      if (vote === "down") {
        vote = "none";
        count += 1;
      } else if (vote === "up") {
        vote = "down";
        count -= 2;
      } else {
        vote = "down";
        count -= 1;
      }
    }

    return { vote, count };
  };

  const handleVote = async (id: string, direction: VoteDirection) => {
    if (!canVote) {
      setErrorMessage("Log in to vote.");
      return;
    }
    if (pendingVotes[id]) {
      return;
    }

    setErrorMessage(null);
    const previousState = votes[id];
    if (!previousState) {
      return;
    }

    const nextState = applyVote(previousState, direction);
    const nextVoteId =
      nextState.vote === "none" || nextState.vote !== previousState.vote
        ? null
        : previousState.voteId;

    setPendingVotes((prev) => ({ ...prev, [id]: true }));
    setVoteFeedback((prev) => ({
      ...prev,
      [id]: {
        tone: "neutral",
        message: direction === "up" ? "Submitting upvote..." : "Submitting downvote...",
      },
    }));
    setVotes((prev) => ({
      ...prev,
      [id]: { ...nextState, voteId: nextVoteId },
    }));

    const shouldRemovePrevious =
      previousState.vote !== "none" && previousState.vote !== nextState.vote;
    let removedPrevious = false;

    if (shouldRemovePrevious && previousState.voteId !== null) {
      const deleteResult = await deleteCaptionVote(previousState.voteId);
      if (!deleteResult.ok) {
        setVotes((prev) => ({
          ...prev,
          [id]: previousState,
        }));
        setErrorMessage(
          deleteResult.error === "AUTH_REQUIRED"
            ? "Log in to vote."
            : "Failed to remove vote."
        );
        setPendingVotes((prev) => ({ ...prev, [id]: false }));
        return;
      }
      removedPrevious = true;
    }

    if (nextState.vote !== "none") {
      const result = await createCaptionVote({
        captionId: id,
        voteValue: nextState.vote === "up" ? 1 : -1,
      });

      if (!result.ok) {
        if (removedPrevious && previousState.vote !== "none") {
          await createCaptionVote({
            captionId: id,
            voteValue: previousState.vote === "up" ? 1 : -1,
          });
        }
        setVotes((prev) => ({
          ...prev,
          [id]: previousState,
        }));
        setErrorMessage(
          result.error === "AUTH_REQUIRED"
            ? "Log in to vote."
            : "Failed to record vote."
        );
        setPendingVotes((prev) => ({ ...prev, [id]: false }));
        return;
      }

      setVotes((prev) => {
        const current = prev[id];
        if (!current) {
          return prev;
        }
        return {
          ...prev,
          [id]: { ...current, voteId: result.id },
        };
      });
    }

    setVoteFeedback((prev) => ({
      ...prev,
      [id]: {
        tone: nextState.vote === "none" ? "neutral" : "positive",
        message:
          nextState.vote === "up"
            ? "Upvoted"
            : nextState.vote === "down"
              ? "Downvoted"
              : "Vote removed",
      },
    }));
    setPendingVotes((prev) => ({ ...prev, [id]: false }));
  };
  const visibleCaptions = captions.slice(0, visibleCount);
  const canLoadMore = visibleCount < captions.length;

  return (
    <div className="space-y-4">
      {errorMessage && (
        <p className="text-xs text-[var(--warning)]">{errorMessage}</p>
      )}
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {visibleCaptions.map((caption) => {
          const voteState = votes[caption.id] ?? {
            vote: "none",
            count: caption.like_count,
            voteId: null,
          };
          const feedback = voteFeedback[caption.id];

          return (
            <li
              key={caption.id}
              className="flex h-full flex-col rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-4 shadow-sm"
            >
              <h2 className="min-h-[4.5rem] text-lg font-semibold leading-7 text-[var(--foreground)]">
                {caption.content ?? "Untitled caption"}
              </h2>

              <div className="mt-3 aspect-[4/3] w-full overflow-hidden rounded-lg border border-[var(--card-border)] bg-[var(--card-alt)]">
                {caption.image?.url ? (
                  <img
                    src={caption.image.url}
                    alt={caption.image.image_description ?? "Caption image"}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs uppercase tracking-wide text-[var(--muted-strong)]">
                    No image
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <p className="rounded-full border border-[var(--card-border)] bg-[var(--card-alt)] px-3 py-1 text-sm text-[var(--muted)]">
                  Score: {voteState.count}
                </p>
                {feedback ? (
                  <p
                    className={`text-xs font-medium ${
                      feedback.tone === "positive"
                        ? "text-[var(--success)]"
                        : "text-[var(--muted)]"
                    }`}
                  >
                    {feedback.message}
                  </p>
                ) : null}
              </div>

              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleVote(caption.id, "up")}
                  aria-pressed={voteState.vote === "up"}
                  disabled={!canVote || pendingVotes[caption.id]}
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    voteState.vote === "up"
                      ? "border-[var(--card-border-strong)] bg-[var(--card-alt)] text-[var(--success)]"
                      : "border-[var(--card-border)] text-[var(--muted)] hover:border-[var(--card-border-strong)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <span className="sr-only">Thumbs up</span>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-[30px] w-[30px]"
                    fill="currentColor"
                  >
                    <path d="M9 22H5a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h4v13Zm3-13 4.62-4.62a2.12 2.12 0 0 1 3.01 0 2.12 2.12 0 0 1 .54 2.06L18.5 9H21a2 2 0 0 1 2 2v3.5a2 2 0 0 1-.2.88l-2.4 5.1A2 2 0 0 1 18.6 22H12a2 2 0 0 1-2-2v-8.5a2 2 0 0 1 .59-1.41L12 9Z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleVote(caption.id, "down")}
                  aria-pressed={voteState.vote === "down"}
                  disabled={!canVote || pendingVotes[caption.id]}
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    voteState.vote === "down"
                      ? "border-[var(--card-border-strong)] bg-[var(--card-alt)] text-[var(--warning)]"
                      : "border-[var(--card-border)] text-[var(--muted)] hover:border-[var(--card-border-strong)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <span className="sr-only">Thumbs down</span>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-[30px] w-[30px]"
                    fill="currentColor"
                  >
                    <path d="M9 2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h4V2Zm3 13-4.62 4.62a2.12 2.12 0 0 0 0 3.01 2.12 2.12 0 0 0 2.06.54L18.5 15H21a2 2 0 0 0 2-2V9.5a2 2 0 0 0-.2-.88l-2.4-5.1A2 2 0 0 0 18.6 2H12a2 2 0 0 0-2 2v8.5a2 2 0 0 0 .59 1.41L12 15Z" />
                  </svg>
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {canLoadMore ? (
        <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex justify-center sm:col-span-2 lg:col-start-2 lg:col-span-2">
            <button
              type="button"
              onClick={() => setVisibleCount((count) => count + 8)}
              className="rounded-full border border-[var(--card-border)] bg-[var(--card-alt)] px-5 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--card-border-strong)] hover:bg-[var(--card)]"
            >
              Load more
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
