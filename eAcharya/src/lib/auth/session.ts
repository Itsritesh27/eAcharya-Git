import { cache } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isRole, redirectTargetFor } from "@/lib/auth/roles";
import { timed } from "@/lib/perf";
import type { Profile, Role } from "@/types/app";

export interface SessionProfile {
  userId: string;
  email: string | null;
  profile: Profile;
}

/**
 * A missing SSR auth cookie means there is no Supabase session for the server
 * client to validate. Short-circuit anonymous reads while still validating any
 * session that is present. If cookie inspection is unavailable, fall back to
 * normal server validation rather than assuming the visitor is anonymous.
 */
async function hasSupabaseAuthCookie(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    return cookieStore.getAll().some(({ name }) =>
      /^sb-.+-auth-token(?:\.\d+)?$/.test(name) || name === "supabase-auth-token",
    );
  } catch {
    return true;
  }
}

/**
 * Resolves the authenticated user ONCE per request (React cache).
 * getClaims() verifies the JWT signature locally against the project's cached
 * JWKS when asymmetric signing keys are enabled, so no Auth round trip is
 * needed; with legacy shared-secret JWTs supabase-js transparently falls back
 * to a server validation, so this is never less safe than getUser().
 * The middleware has already refreshed an expired token before this runs.
 */
const getAuthUser = cache(async (): Promise<{ id: string; email: string | null } | null> => {
  const supabase = await createClient();
  const { data, error } = await timed("auth.getClaims (page)", () => supabase.auth.getClaims());
  const claims = data?.claims;
  if (error || !claims?.sub) return null;
  return { id: claims.sub, email: typeof claims.email === "string" ? claims.email : null };
});

/**
 * Returns the signed-in user's profile, or null when signed out / unconfigured.
 * Identity comes from getClaims() (signature-verified JWT), never from unverified cookies.
 * The role always comes from the database, never from the request.
 */
export const getSessionProfile = cache(async (): Promise<SessionProfile | null> => {
  if (!isSupabaseConfigured() || !(await hasSupabaseAuthCookie())) return null;

  const user = await getAuthUser();
  if (!user) return null;
  const supabase = await createClient();

  const { data, error } = await timed("profiles query", () =>
    supabase
      .from("profiles")
      .select("id, full_name, avatar_url, role, created_at, updated_at")
      .eq("id", user.id)
      .maybeSingle(),
  );

  if (error || !data || !isRole((data as Profile).role)) {
    // Signed in but no usable profile: send to a page that does NOT bounce
    // authenticated users, so this cannot loop.
    redirect("/auth/profile-error");
  }

  return { userId: user.id, email: user.email, profile: data as Profile };
});

/** Signed-in user's id and role for public pages. Never redirects; null if unavailable. */
export async function getViewer(): Promise<{ userId: string; role: Role } | null> {
  if (!isSupabaseConfigured() || !(await hasSupabaseAuthCookie())) return null;
  try {
    const user = await getAuthUser();
    if (!user) return null;
    const supabase = await createClient();
    const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    const role = (data as { role?: unknown } | null)?.role;
    return isRole(role) ? { userId: user.id, role } : null;
  } catch {
    return null;
  }
}

/** Requires any signed-in user (all roles). Signed-out visitors go to sign-in and come back. */
export async function requireSession(nextPath: string): Promise<SessionProfile> {
  const session = await getSessionProfile();
  if (!session) redirect(`/sign-in?next=${encodeURIComponent(nextPath)}`);
  return session;
}

/** Lightweight check for public pages (header state). Never redirects. */
export async function isSignedIn(): Promise<boolean> {
  if (!isSupabaseConfigured() || !(await hasSupabaseAuthCookie())) return false;
  try {
    return Boolean(await getAuthUser());
  } catch {
    return false;
  }
}

/**
 * Server-side guard for dashboards. Call at the top of every protected page/layout.
 * - signed out  -> /sign-in
 * - wrong role  -> that user's own dashboard (which always admits them, so no loop)
 */
export async function requireRole(area: Role): Promise<SessionProfile> {
  const session = await getSessionProfile();
  const target = redirectTargetFor(session?.profile.role ?? null, area);
  if (target) redirect(target);
  return session as SessionProfile;
}
