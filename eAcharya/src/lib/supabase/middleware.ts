import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";
import { timed } from "@/lib/perf";

/**
 * Refreshes a present Supabase session cookie and applies coarse route
 * protection. Anonymous requests bypass the Auth network call; fine-grained
 * role checks remain in server guards (src/lib/auth/session.ts).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const env = getSupabaseEnv();
  const { pathname } = request.nextUrl;

  // Without Supabase configured, public pages still work; private ones bounce to sign-in.
  if (!env) {
    if (pathname.startsWith("/dashboard")) {
      const url = request.nextUrl.clone();
      url.pathname = "/sign-in";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return response;
  }

  // Anonymous visits are common on public learning pages. Without a Supabase
  // auth cookie there is no session to refresh or validate, so avoid creating a
  // client and making an Auth network round trip for those requests.
  // Supabase SSR may chunk larger auth cookies as `.0`, `.1`, etc.
  const hasAuthCookie = request.cookies.getAll().some(({ name }) =>
    /^sb-.+-auth-token(?:\.\d+)?$/.test(name) || name === "supabase-auth-token",
  );
  if (!hasAuthCookie) {
    if (pathname.startsWith("/dashboard")) {
      const url = request.nextUrl.clone();
      url.pathname = "/sign-in";
      url.search = `?next=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(url);
    }
    return response;
  }

  let supabase: ReturnType<typeof createServerClient>;
  try {
    supabase = createServerClient(env.url, env.key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });
  } catch (err) {
    // Bad Supabase URL/key (e.g. stray quotes or spaces in Netlify env vars).
    console.error("[middleware] Supabase client failed:", err);
    return failClosed(request, pathname, response);
  }

  // getClaims() refreshes an expired token and verifies the JWT signature
  // locally (JWKS is cached), avoiding an Auth-server round trip on every
  // request. Unlike getSession() it never trusts an unverified cookie.
  let user: { id: string } | null = null;
  try {
    const result = await timed("auth.getClaims (middleware)", () => supabase.auth.getClaims());
    const sub = result.data?.claims?.sub;
    user = sub ? { id: sub } : null;
  } catch (err) {
    console.error("[middleware] getUser failed:", err);
    return failClosed(request, pathname, response);
  }

  if (!user && pathname.startsWith("/dashboard")) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  if (user && (pathname === "/sign-in" || pathname === "/sign-up")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

/** Public pages keep working; private pages go to sign-in. */
function failClosed(request: NextRequest, pathname: string, response: NextResponse) {
  if (pathname.startsWith("/dashboard")) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return response;
}
