"use client";

import dynamic from "next/dynamic";

/** LiveKit is large; load it only on the live-room route, never in shared bundles. */
export const LiveRoom = dynamic(() => import("./live-room").then((m) => m.LiveRoom), {
  ssr: false,
  loading: () => <p className="p-6 text-sm text-forest-600">Loading live room…</p>,
});
