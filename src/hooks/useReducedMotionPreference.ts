import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";
const getMedia = (): MediaQueryList | undefined =>
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(QUERY)
    : undefined;

const subscribe = (onChange: () => void): (() => void) => {
  const media = getMedia();
  if (!media) return () => {};
  if (typeof media.addEventListener === "function") {
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }
  // Older Safari exposes only the legacy MediaQueryList listener API.
  media.addListener(onChange);
  return () => media.removeListener(onChange);
};

const getSnapshot = (): boolean => getMedia()?.matches ?? false;
const getServerSnapshot = (): boolean => false;

// Framer Motion 11's useReducedMotion snapshots the initial value. Subscribe
// directly so an OS setting change also updates imperative animation decisions.
export const useReducedMotionPreference = (): boolean =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
