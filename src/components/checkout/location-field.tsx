"use client";

import { ExternalLink, LoaderCircle, LocateFixed, MapPinCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GeolocationStatus } from "@/hooks/use-geolocation";
import { formatAccuracy, mapsViewUrl } from "@/lib/maps";
import type { GeoPoint } from "@/lib/validation/order";

interface LocationFieldProps {
  status: GeolocationStatus;
  point: GeoPoint | null;
  onLocate: () => void;
  onClear: () => void;
}

const PROBLEMS: Partial<Record<GeolocationStatus, string>> = {
  denied:
    "Location access is blocked for this site. Allow it in your browser's site settings, or just rely on the address above.",
  timeout: "Couldn't get a fix in time. Try again near a window, or rely on the address above.",
  unavailable: "Your device couldn't determine a location right now. The address above is enough.",
};

/**
 * Optional GPS pin for the delivery address. Asks for location permission on
 * tap (never on page load), then shows what was captured so the customer can
 * check it on a map or drop it.
 */
export function LocationField({ status, point, onLocate, onClear }: LocationFieldProps) {
  if (status === "unsupported") return null;

  if (point) {
    const accuracy = formatAccuracy(point.accuracy);
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm">
        <MapPinCheck className="size-4 shrink-0 text-emerald-400" aria-hidden />
        <span className="text-emerald-400">
          Location pinned{accuracy ? ` · ${accuracy}` : ""}
        </span>
        <span className="ml-auto flex items-center gap-1">
          <Button asChild variant="ghost" size="xs" className="h-7 text-muted-foreground">
            <a href={mapsViewUrl(point.lat, point.lng)} target="_blank" rel="noreferrer">
              Check on map <ExternalLink aria-hidden />
            </a>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-7 text-muted-foreground"
            aria-label="Remove pinned location"
            onClick={onClear}
          >
            <X />
          </Button>
        </span>
      </div>
    );
  }

  const problem = PROBLEMS[status];
  const locating = status === "locating";
  return (
    <div className="space-y-1.5">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onLocate}
        disabled={locating || status === "denied"}
        aria-describedby={problem ? "checkout-location-help" : undefined}
      >
        {locating ? (
          <LoaderCircle className="animate-spin" aria-hidden data-icon="inline-start" />
        ) : (
          <LocateFixed aria-hidden data-icon="inline-start" />
        )}
        {locating ? "Finding you…" : "Pin my location for the rider"}
      </Button>
      {problem ? (
        <p id="checkout-location-help" className="text-xs text-destructive">
          {problem}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Optional. Shares your GPS position once so the rider finds the door faster.
        </p>
      )}
    </div>
  );
}
