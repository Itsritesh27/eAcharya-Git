"use client";

import { useEffect, useRef } from "react";

/** <details> that closes on outside tap, Escape, or after a link/button inside is used. */
export function AutoCloseDetails({
  summary,
  className,
  summaryClassName,
  children,
}: {
  summary: React.ReactNode;
  className?: string;
  summaryClassName?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const close = () => el.removeAttribute("open");
    const onPointer = (e: PointerEvent) => {
      if (el.open && !el.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && el.open) {
        close();
        el.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <details ref={ref} className={className}>
      <summary className={summaryClassName}>{summary}</summary>
      {/* Links close the menu after navigating. */}
      <div onClick={(e) => (e.target as HTMLElement).closest("a") && ref.current?.removeAttribute("open")}>
        {children}
      </div>
    </details>
  );
}
