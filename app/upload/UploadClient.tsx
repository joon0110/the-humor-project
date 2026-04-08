"use client";

import { useEffect, useMemo, useState } from "react";
import { setCaptionsPublic } from "./actions";

type PresignedResponse = {
  presignedUrl: string;
  cdnUrl: string;
};

type RegisterResponse = {
  imageId: string;
  now?: number;
};

type CaptionRecord = {
  id: string;
  content: string | null;
  created_datetime_utc?: string | null;
};

const BASE_URL = "https://api.almostcrackd.ai";
const SUPPORTED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
];

const EXTENSION_TO_TYPE: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".heic": "image/heic",
};

const STEPS = [
  "Generate presigned URL",
  "Upload image bytes",
  "Register image URL",
  "Generate captions",
];

function resolveContentType(file: File): string | null {
  if (file.type) return file.type;
  const name = file.name.toLowerCase();
  const extIndex = name.lastIndexOf(".");
  if (extIndex === -1) return null;
  const ext = name.slice(extIndex);
  return EXTENSION_TO_TYPE[ext] ?? null;
}

export default function UploadClient() {
  const [file, setFile] = useState<File | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepIndex, setStepIndex] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [captions, setCaptions] = useState<CaptionRecord[] | null>(null);
  const [imageId, setImageId] = useState<string | null>(null);
  const [cdnUrl, setCdnUrl] = useState<string | null>(null);
  const [publicSaveMessage, setPublicSaveMessage] = useState<string | null>(
    null
  );

  const previewUrl = useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function fetchAccessToken(): Promise<string> {
    const response = await fetch("/api/auth/jwt");
    if (!response.ok) {
      throw new Error("Please log in to request a JWT.");
    }
    const data = (await response.json()) as { accessToken?: string };
    if (!data.accessToken) {
      throw new Error("JWT not available. Try logging in again.");
    }
    return data.accessToken;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setCaptions(null);
    setImageId(null);
    setCdnUrl(null);
    setStepIndex(null);
    setPublicSaveMessage(null);

    if (!file) {
      setErrorMessage("Select an image before running the pipeline.");
      return;
    }

    const contentType = resolveContentType(file);
    if (!contentType || !SUPPORTED_TYPES.includes(contentType)) {
      setErrorMessage(
        `Unsupported file type. Supported: ${SUPPORTED_TYPES.join(", ")}.`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const token = await fetchAccessToken();

      setStepIndex(0);
      const presignedResponse = await fetch(
        `${BASE_URL}/pipeline/generate-presigned-url`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ contentType }),
        }
      );

      if (!presignedResponse.ok) {
        throw new Error(await presignedResponse.text());
      }

      const step1 = (await presignedResponse.json()) as PresignedResponse;
      if (!step1.presignedUrl || !step1.cdnUrl) {
        throw new Error("Step 1 response missing presignedUrl or cdnUrl.");
      }

      setCdnUrl(step1.cdnUrl);

      setStepIndex(1);
      const uploadResponse = await fetch(step1.presignedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": contentType,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error(await uploadResponse.text());
      }

      setStepIndex(2);
      const registerResponse = await fetch(
        `${BASE_URL}/pipeline/upload-image-from-url`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            imageUrl: step1.cdnUrl,
            isCommonUse: false,
          }),
        }
      );

      if (!registerResponse.ok) {
        throw new Error(await registerResponse.text());
      }

      const step3 = (await registerResponse.json()) as RegisterResponse;
      if (!step3.imageId) {
        throw new Error("Step 3 response missing imageId.");
      }

      setImageId(step3.imageId);

      setStepIndex(3);
      const captionResponse = await fetch(
        `${BASE_URL}/pipeline/generate-captions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ imageId: step3.imageId }),
        }
      );

      if (!captionResponse.ok) {
        throw new Error(await captionResponse.text());
      }

      const step4 = (await captionResponse.json()) as CaptionRecord[];
      setCaptions(step4);
      setStepIndex(STEPS.length);

      if (isPublic && step4.length > 0) {
        const captionIds = step4.map((caption) => caption.id);
        const updateResult = await setCaptionsPublic(captionIds, true);
        if (!updateResult.ok) {
          setErrorMessage(
            `Captions generated, but failed to mark them public: ${updateResult.error}`
          );
        } else {
          setPublicSaveMessage(
            "Saved publicly. These captions now appear in the Public Caption Feed for voting and ranking."
          );
        }
      } else if (step4.length > 0) {
        setPublicSaveMessage(
          "Generated captions are private until you choose to save them publicly."
        );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected error";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <section className="space-y-8 rounded-3xl border border-[var(--card-border)] bg-[linear-gradient(145deg,var(--card),var(--card),var(--card-alt))] p-6 shadow-[0_18px_34px_rgba(0,0,0,0.12)]">
        <div className="space-y-5">
          <div className="inline-flex w-fit items-center rounded-full border border-[var(--card-border-strong)] bg-[var(--card-alt)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--warning)]">
            Primary flow
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              Upload image and run the caption pipeline
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Follow the steps in order. Upload an image, run the pipeline,
              review your generated captions, then save them publicly if you
              want them included in ranking and voting.
            </p>
          </div>
          <ol className="grid gap-3 sm:grid-cols-2">
            {[
              "Upload image",
              "Run pipeline",
              "Review captions",
              "Save or rank",
            ].map((step, index) => (
              <li
                key={step}
                className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-alt)] px-4 py-3 text-sm text-[var(--foreground)]"
              >
                <span className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--foreground)] text-xs font-bold text-[var(--background)]">
                  {index + 1}
                </span>
                <div className="font-medium">{step}</div>
              </li>
            ))}
          </ol>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-3">
            <label
              htmlFor="upload-file"
              className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-strong)]"
            >
              Step 1: Upload image
            </label>
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--card-border)] bg-[var(--card-alt)] p-4">
              <label
                htmlFor="upload-file"
                className="inline-flex items-center justify-center rounded-full border border-[var(--card-border-strong)] bg-[var(--card)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--card-alt)]"
              >
                Choose file
              </label>
              <span className="text-sm text-[var(--muted)]">
                {file ? file.name : "No file chosen"}
              </span>
            </div>
            <input
              id="upload-file"
              type="file"
              accept={SUPPORTED_TYPES.join(",")}
              className="sr-only"
              onChange={(event) => {
                const nextFile = event.target.files?.[0] ?? null;
                setFile(nextFile);
                setCaptions(null);
                setImageId(null);
                setCdnUrl(null);
                setErrorMessage(null);
                setStepIndex(null);
                setPublicSaveMessage(null);
              }}
            />
          </div>

          <div className="space-y-3 rounded-2xl border border-[var(--card-border)] bg-[var(--card-alt)] p-4">
            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-strong)]">
                Step 2: Run pipeline
              </div>
              <p className="text-sm text-[var(--muted)]">
                Generate caption options from the uploaded image.
              </p>
            </div>
            <label className="flex items-start gap-3 text-sm text-[var(--foreground)]">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-[var(--card-border-strong)] bg-[var(--card)]"
                checked={isPublic}
                onChange={(event) => setIsPublic(event.target.checked)}
              />
              <span className="space-y-1">
                <span className="block font-medium">
                  Save generated captions publicly after generation
                </span>
                <span className="block text-xs leading-5 text-[var(--muted)]">
                  Public captions appear in the Public Caption Feed where other
                  users can vote on them and sort by likes.
                </span>
              </span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-w-[13rem] items-center justify-center rounded-full border border-[var(--cta-border)] bg-[var(--cta-bg)] px-6 py-3 text-sm font-semibold text-[var(--cta-text)] shadow-[0_10px_20px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 hover:bg-[var(--cta-hover)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Running pipeline..." : "Run Caption Pipeline"}
            </button>
          </div>
        </form>

        {previewUrl ? (
          <div className="overflow-hidden rounded-2xl border border-[var(--card-border)] shadow-lg">
            <img
              src={previewUrl}
              alt="Upload preview"
              className="h-72 w-full object-cover"
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--card-border)] bg-[var(--card-alt)] p-8 text-sm text-[var(--muted)]">
            Upload an image to preview it here.
          </div>
        )}
      </section>

      <section className="space-y-6 rounded-3xl border border-[var(--card-border)] bg-[var(--card)] p-6 shadow-sm">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight">
            Review and save
          </h2>
          <p className="text-sm text-[var(--muted)]">
            Watch pipeline progress, then review your generated captions.
          </p>
        </div>

        <ol className="space-y-2 text-sm">
          {STEPS.map((step, index) => {
            const isActive = stepIndex === index;
            const isDone = stepIndex !== null && index < stepIndex;
            return (
              <li
                key={step}
                className={`rounded-lg border px-3 py-2 ${
                  isActive
                    ? "border-[var(--card-border-strong)] bg-[var(--card-alt)] text-[var(--foreground)]"
                    : isDone
                      ? "border-[var(--card-border)] bg-[var(--card)] text-[var(--muted)]"
                      : "border-[var(--card-border)] bg-[var(--background)] text-[var(--muted-strong)]"
                }`}
              >
                {step}
              </li>
            );
          })}
        </ol>

        {errorMessage ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-[var(--danger)]">
            {errorMessage}
          </div>
        ) : null}

        {imageId ? (
          <div className="space-y-1 text-xs text-[var(--muted)]">
            <div>Image ID: {imageId}</div>
            {cdnUrl ? <div>CDN URL: {cdnUrl}</div> : null}
          </div>
        ) : null}

        {publicSaveMessage ? (
          <div className="rounded-xl border border-[var(--card-border-strong)] bg-[var(--card-alt)] p-4 text-sm text-[var(--success)]">
            {publicSaveMessage}
          </div>
        ) : null}

        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-strong)]">
            Step 3: Your Generated Captions
          </h3>
          {captions ? (
            captions.length === 0 ? (
              <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-4 text-sm text-[var(--muted)]">
                No captions returned.
              </div>
            ) : (
              <ul className="space-y-3">
                {captions.map((caption) => (
                  <li
                    key={caption.id}
                    className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-4 text-sm text-[var(--foreground)]"
                  >
                    {caption.content ?? "Untitled caption"}
                  </li>
                ))}
              </ul>
            )
          ) : (
            <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card-alt)] p-4 text-sm text-[var(--muted)]">
              <div className="flex items-center gap-3">
                {isSubmitting ? (
                  <span
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--card-border-strong)] border-t-[var(--foreground)]"
                  />
                ) : null}
                <span>
                  Captions will appear here after the pipeline finishes. Save
                  them publicly if you want them included in the Public Caption
                  Feed.
                </span>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
