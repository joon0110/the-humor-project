import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

type BugReport = {
  id: number;
  subject: string | null;
  message: string | null;
  created_datetime_utc: string;
};

async function fetchBugReports() {
  const { data, error } = await supabase
    .from("bug_reports")
    .select("id, subject, message, created_datetime_utc")
    .order("created_datetime_utc", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as BugReport[];
}

export default async function Home() {
  let bugReports: BugReport[] = [];
  let errorMessage: string | null = null;

  try {
    bugReports = await fetchBugReports();
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unknown error";
  }

  return (
    <div className="min-h-screen bg-black px-6 pb-12 pt-0 text-zinc-50">
      <div className="-mx-6 w-screen border-b border-white/10 bg-zinc-950/90 py-4 text-center text-sm font-semibold uppercase tracking-[0.3em] text-white">
        The Humor Project
      </div>
      <main className="mx-auto mt-6 flex w-full max-w-3xl flex-col gap-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            Bug Reports
          </h1>
          <p className="text-sm text-zinc-400">
            Live data from Supabase.
          </p>
        </header>

        <div className="max-h-[70vh] overflow-y-auto pr-2">
          {errorMessage ? (
            <div className="rounded-lg border border-red-900/40 bg-red-950/40 p-4 text-sm text-red-200">
              Failed to load bug reports: {errorMessage}
            </div>
          ) : bugReports.length === 0 ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-400">
              No bug reports yet.
            </div>
          ) : (
            <ul className="space-y-4">
              {bugReports.map((report) => (
                <li
                  key={report.id}
                  className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 shadow-sm"
                >
                  <div className="text-xs uppercase tracking-wide text-zinc-400">
                    #{report.id} •{" "}
                    {new Date(report.created_datetime_utc).toLocaleString()}
                  </div>
                  <h2 className="mt-2 text-lg font-semibold">
                    {report.subject ?? "Untitled report"}
                  </h2>
                  {report.message && (
                    <p className="mt-2 text-sm text-zinc-300">
                      {report.message}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
