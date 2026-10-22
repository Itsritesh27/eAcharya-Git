import type { Map as LeafletMap } from "leaflet";

/**
 * On touch screens a one-finger drag on a full-width map traps page scrolling.
 * Keep one-finger drags for scrolling the page; two fingers pan/zoom the map.
 * Taps (selecting a point) and the zoom buttons keep working.
 */
export function enableTwoFingerPan(map: LeafletMap) {
  if (typeof window === "undefined" || !window.matchMedia("(pointer: coarse)").matches) return;
  const el = map.getContainer();
  map.dragging.disable();

  const onStart = (e: TouchEvent) => {
    if (e.touches.length >= 2) map.dragging.enable();
  };
  const onEnd = (e: TouchEvent) => {
    if (e.touches.length === 0) map.dragging.disable();
  };
  el.addEventListener("touchstart", onStart, { passive: true });
  el.addEventListener("touchend", onEnd, { passive: true });
  el.addEventListener("touchcancel", onEnd, { passive: true });
  map.on("unload", () => {
    el.removeEventListener("touchstart", onStart);
    el.removeEventListener("touchend", onEnd);
    el.removeEventListener("touchcancel", onEnd);
  });
}
