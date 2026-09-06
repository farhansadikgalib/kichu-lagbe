/** Google Maps links for a pinned delivery point. Work on every platform without an API key. */

export function mapsViewUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export function mapsDirectionsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
}

/** "±25 m" style accuracy label, or null when unknown. */
export function formatAccuracy(metres: number | null | undefined) {
  if (metres == null) return null;
  return metres >= 1000 ? `±${(metres / 1000).toFixed(1)} km` : `±${Math.round(metres)} m`;
}
