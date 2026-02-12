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

type CaptionListProps = {
  captions: Caption[];
  canVote: boolean;
};

export default function CaptionList({ captions, canVote }: CaptionListProps) {
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

    setPendingVotes((prev) => ({ ...prev, [id]: false }));
  };

  return (
    <div className="space-y-3">
      {errorMessage && (
        <p className="text-xs text-amber-400">{errorMessage}</p>
      )}
      <ul className="space-y-4">
        {captions.map((caption) => {
          const voteState = votes[caption.id] ?? {
            vote: "none",
            count: caption.like_count,
            voteId: null,
          };

          return (
            <li
              key={caption.id}
              className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="aspect-[4/3] w-full overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 sm:w-56">
                  {caption.image?.url ? (
                    <img
                      src={caption.image.url}
                      alt={caption.image.image_description ?? "Caption image"}
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
                    Likes: {voteState.count}
                  </p>
                  <div className="mt-6 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleVote(caption.id, "up")}
                      aria-pressed={voteState.vote === "up"}
                      disabled={!canVote || pendingVotes[caption.id]}
                      className={`inline-flex items-center justify-center transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        voteState.vote === "up"
                          ? "text-white"
                          : "text-zinc-500 hover:text-zinc-200"
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
                      className={`inline-flex items-center justify-center transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        voteState.vote === "down"
                          ? "text-white"
                          : "text-zinc-500 hover:text-zinc-200"
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
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
