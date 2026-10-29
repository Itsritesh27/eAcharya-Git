"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import { GlobeIllustration } from "./globe-illustration";

type EarthProps = { className?: string };

/**
 * Keeps the decorative globe out of the initial homepage client bundle's active
 * work. The server and first client render use the lightweight SVG. On capable
 * desktop devices, the WebGL component is imported only when the hero is near
 * the viewport and the browser has an idle window. Mobile/Data Saver/low-memory
 * devices keep the SVG and never download the Three.js route chunk.
 */
export function DeferredEarth3D({ className }: EarthProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [EarthComponent, setEarthComponent] = useState<ComponentType<EarthProps> | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const nav = navigator as Navigator & {
      connection?: { saveData?: boolean };
      deviceMemory?: number;
    };
    const lightweightDevice =
      window.matchMedia("(max-width: 767px)").matches ||
      nav.connection?.saveData === true ||
      (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 2);

    if (lightweightDevice) return;

    let cancelled = false;
    let idleHandle: number | undefined;
    let timeoutHandle: number | undefined;
    let observer: IntersectionObserver | undefined;

    const loadEarth = async () => {
      try {
        const earthModule = await import("./earth-3d");
        if (!cancelled) setEarthComponent(() => earthModule.Earth3D);
      } catch {
        // The already-rendered SVG remains a complete, accessible fallback.
      }
    };

    const scheduleLoad = () => {
      const win = window as Window & {
        requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
        cancelIdleCallback?: (handle: number) => void;
      };
      if (win.requestIdleCallback) {
        idleHandle = win.requestIdleCallback(() => void loadEarth(), { timeout: 1800 });
      } else {
        timeoutHandle = window.setTimeout(() => void loadEarth(), 300);
      }
    };

    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            observer?.disconnect();
            scheduleLoad();
          }
        },
        { rootMargin: "120px" },
      );
      observer.observe(host);
    } else {
      scheduleLoad();
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
      const win = window as Window & { cancelIdleCallback?: (handle: number) => void };
      if (idleHandle !== undefined) win.cancelIdleCallback?.(idleHandle);
      if (timeoutHandle !== undefined) window.clearTimeout(timeoutHandle);
    };
  }, []);

  return (
    <div ref={hostRef} className={className}>
      {EarthComponent ? <EarthComponent className="h-auto w-full" /> : <GlobeIllustration className="h-auto w-full" />}
    </div>
  );
}
