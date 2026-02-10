import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isAllowedEmailDomain } from "@/lib/auth/allowed-domains";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next();

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
  matcher: ["/welcome", "/bugreports", "/captions"],
};
