/**
 * True when the page runs as an installed app (home-screen PWA) rather than
 * in a browser tab. `navigator.standalone` covers older iOS Safari, which
 * doesn't report the display-mode media query.
 */
export function isStandaloneDisplay() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true)
  );
}
