"use client";

import { useEffect, useSyncExternalStore } from "react";

type ThemePreference = "system" | "light" | "dark";

const OPTIONS: Array<{ value: ThemePreference; label: string }> = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];
const THEME_STORAGE_KEY = "theme-preference";
const THEME_EVENT = "theme-preference-change";

function applyThemePreference(preference: ThemePreference) {
  const root = document.documentElement;
  if (preference === "system") {
    root.removeAttribute("data-theme");
    return;
  }
  root.setAttribute("data-theme", preference);
}

function readStoredPreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
}

function subscribePreference(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY) {
      callback();
    }
  };
  const handleThemeChange = () => callback();

  window.addEventListener("storage", handleStorage);
  window.addEventListener(THEME_EVENT, handleThemeChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(THEME_EVENT, handleThemeChange);
  };
}

export default function ThemeToggle() {
  const preference = useSyncExternalStore<ThemePreference>(
    subscribePreference,
    readStoredPreference,
    (): ThemePreference => "system"
  );

  useEffect(() => {
    applyThemePreference(preference);
  }, [preference]);

  useEffect(() => {
    if (preference !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyThemePreference("system");
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [preference]);

  const handleSelect = (value: ThemePreference) => {
    window.localStorage.setItem(THEME_STORAGE_KEY, value);
    window.dispatchEvent(new Event(THEME_EVENT));
  };

  return (
    <div className="rounded-[32px] border border-[var(--card-border)] bg-[var(--card)] p-4 shadow-[0_18px_34px_rgba(0,0,0,0.18)]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.42em] text-[var(--muted-strong)]">
        Theme
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {OPTIONS.map((option) => {
          const isActive = option.value === preference;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`mx-auto flex aspect-square w-full max-w-12 items-center justify-center rounded-full border transition ${
                isActive
                  ? "border-[var(--card-border-strong)] bg-[var(--card-alt)] text-[var(--foreground)]"
                  : "border-[var(--card-border)] bg-transparent text-[var(--muted)] hover:bg-[var(--card-alt)]"
              }`}
              aria-label={`${option.label} theme`}
            >
              {option.value === "light" ? (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2" />
                  <path d="M12 20v2" />
                  <path d="M4.93 4.93l1.41 1.41" />
                  <path d="M17.66 17.66l1.41 1.41" />
                  <path d="M2 12h2" />
                  <path d="M20 12h2" />
                  <path d="M4.93 19.07l1.41-1.41" />
                  <path d="M17.66 6.34l1.41-1.41" />
                </svg>
              ) : null}
              {option.value === "dark" ? (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12.4a8.2 8.2 0 1 1-9.4-9.4 7 7 0 0 0 9.4 9.4Z" />
                </svg>
              ) : null}
              {option.value === "system" ? (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="12" rx="2" />
                  <path d="M7 20h10" />
                  <path d="M9 16v4" />
                  <path d="M15 16v4" />
                </svg>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
