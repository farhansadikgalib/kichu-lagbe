import { z } from "zod";
import { requireUser } from "@/lib/auth/guards";
import { handleApiError, ok } from "@/lib/api/response";

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

interface NominatimAddress {
  house_number?: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  quarter?: string;
  residential?: string;
  city?: string;
  town?: string;
  village?: string;
}

interface NominatimResponse {
  display_name?: string;
  address?: NominatimAddress;
}

/** "House 12, Road 5, Merul Badda, Dhaka" — short enough to edit, long enough to find. */
function composeAddress(body: NominatimResponse): string | null {
  const a = body.address ?? {};
  const parts = [
    [a.house_number, a.road].filter(Boolean).join(" "),
    a.neighbourhood ?? a.suburb ?? a.quarter ?? a.residential,
    a.city ?? a.town ?? a.village,
  ].filter(Boolean);
  if (parts.length > 0) return parts.join(", ");
  // Fall back to the first few segments of the full display name.
  return body.display_name?.split(",").slice(0, 3).join(",").trim() || null;
}

/** Resolve a pinned GPS point to a human-readable address (OpenStreetMap Nominatim). */
export async function GET(request: Request) {
  try {
    await requireUser();
    const { searchParams } = new URL(request.url);
    const { lat, lng } = querySchema.parse({
      lat: searchParams.get("lat"),
      lng: searchParams.get("lng"),
    });

    const url =
      "https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&addressdetails=1&accept-language=en" +
      // ~11 m precision keeps the upstream cache warm across GPS jitter.
      `&lat=${lat.toFixed(4)}&lon=${lng.toFixed(4)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "KichuLagbe/1.0 (kichulagbe.vercel.app)" },
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!res.ok) return ok({ address: null });

    const body = (await res.json()) as NominatimResponse;
    return ok({ address: composeAddress(body) });
  } catch (err) {
    return handleApiError(err);
  }
}
