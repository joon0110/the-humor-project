import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isAllowedEmailDomain } from "@/lib/auth/allowed-domains";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";

function clearSupabaseCookies(request: NextRequest, response: NextResponse, storageKey: string) {
  request.cookies
    .getAll()
    .filter(
      (cookie) =>
        cookie.name === storageKey || cookie.name.startsWith(`${storageKey}.`)
    )
    .forEach((cookie) => {
      response.cookies.set(cookie.name, "", { path: "/", maxAge: 0 });
    });
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.getUser();
  const user = data.user ?? null;

  if (error?.code === "refresh_token_not_found") {
    const redirectResponse = NextResponse.redirect(
      new URL("/login", request.url)
    );
    clearSupabaseCookies(request, redirectResponse, "supabase.auth.token");
    return redirectResponse;
  }

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!isAllowedEmailDomain(user.email)) {
    response = NextResponse.redirect(new URL("/login?error=domain", request.url));
    await supabase.auth.signOut();
    return response;
  }

  return response;
}

export const config = {
  matcher: ["/welcome", "/bug-reports", "/captions", "/upload"],
};
