import GoogleSignInButton from "@/app/components/GoogleSignInButton";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const showDomainError = resolvedSearchParams?.error === "domain";

  return (
    <div className="min-h-screen bg-[var(--background)] px-6 pb-12 pt-6 text-[var(--foreground)]">
      <main className="mx-auto mt-6 flex w-full max-w-3xl flex-col gap-6">
        <header className="space-y-2">
          <h1 className="text-5xl font-semibold tracking-tight">
            The Humor Project
          </h1>
          <p className="text-sm text-[var(--muted)]">
            A web applications with NextJS, TailwindCSS, and Supabase.
          </p>
        </header>

        <section className="space-y-4 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6 text-sm text-[var(--muted)]">
          {showDomainError && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-[var(--danger)]">
              Please use a @columbia.edu or @barnard.edu Google account.
            </div>
          )}
          <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-alt)] p-4">
            <GoogleSignInButton variant="inline" />
          </div>
          <p>
            Sign in with your @columbia.edu or @barnard.edu Google account.
          </p>
        </section>
      </main>
    </div>
  );
}
