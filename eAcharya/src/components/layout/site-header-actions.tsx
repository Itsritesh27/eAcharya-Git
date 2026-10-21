"use client";

import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { MobileMenu } from "./mobile-menu";

/**
 * Authentication state here is used only to choose the public navigation CTA.
 * Server-side route guards and RLS remain responsible for authorization.
 * Reading the existing browser session avoids an Auth network request during
 * every public page render and keeps the public header cache-friendly.
 */
export function SiteHeaderActions() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setSignedIn(false);
      return;
    }

    // A signed-out visitor has no SSR auth cookie; do not download the browser
    // auth client just to display the same public Sign In / Get Started links.
    const hasAuthCookie = document.cookie.split(";").some((cookie) => {
      const name = cookie.trim().split("=", 1)[0];
      return /^sb-.+-auth-token(?:\.\d+)?$/.test(name) || name === "supabase-auth-token";
    });
    if (!hasAuthCookie) {
      setSignedIn(false);
      return;
    }

    let active = true;
    let unsubscribe: (() => void) | undefined;

    // Split the Supabase browser client out of the initial public-page bundle;
    // it is used only to personalize the navigation CTA after hydration.
    void import("@/lib/supabase/client")
      .then(({ createClient }) => {
        if (!active) return;
        const supabase = createClient();

        // getSession reads the browser's locally stored session. It is display
        // state only; it never authorizes protected data or actions.
        void supabase.auth.getSession().then(({ data }) => {
          if (active) setSignedIn(Boolean(data.session));
        });

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
          if (active) setSignedIn(Boolean(session));
        });
        unsubscribe = () => authListener.subscription.unsubscribe();
      })
      .catch(() => {
        if (active) setSignedIn(false);
      });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const isAuthenticated = signedIn === true;

  return (
    <>
      <div className="hidden items-center gap-2 md:flex">
        {isAuthenticated ? (
          <ButtonLink href="/dashboard" size="sm">
            Dashboard
          </ButtonLink>
        ) : (
          <>
            <ButtonLink href="/sign-in" variant="ghost" size="sm">
              Sign In
            </ButtonLink>
            <ButtonLink href="/sign-up" size="sm">
              Get Started
            </ButtonLink>
          </>
        )}
      </div>
      <MobileMenu signedIn={isAuthenticated} />
    </>
  );
}
