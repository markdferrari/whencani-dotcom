"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, Search, Loader2, AlertCircle } from "lucide-react";
import type { GeocodeResponse, NearbyCinemasResponse } from "@/lib/types/cinemas";
import dynamic from "next/dynamic";

const DEFAULT_RADIUS_KM = 10;

const NearbyCinemasMap = dynamic(() => import("./NearbyCinemasMap"), {
  ssr: false,
  loading: () => (
    <div className="h-72 w-full animate-pulse rounded-lg border border-secondary bg-secondary/20" />
  ),
});

type LatLng = {
  lat: number;
  lng: number;
};

function googleMapsUrl(lat: number, lng: number, name?: string): string {
  if (name) {
    return `https://www.google.com/maps?q=${encodeURIComponent(name)}`;
  }
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export default function FindShowtimes() {
  const [city, setCity] = useState<string>("");
  const [cinemas, setCinemas] = useState<NearbyCinemasResponse["cinemas"]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geolocationAttempted, setGeolocationAttempted] = useState(false);
  const [center, setCenter] = useState<LatLng | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [isCitySearchOpen, setIsCitySearchOpen] = useState(false);
  const cityInputRef = useRef<HTMLInputElement | null>(null);

  // Attempt to get user's location on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeolocationAttempted(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setGeolocationAttempted(true);
        await searchNearby(position.coords.latitude, position.coords.longitude);
      },
      () => {
        // Geolocation denied or unavailable - just mark as attempted
        setGeolocationAttempted(true);
      },
      { timeout: 5000 },
    );
  }, []);

  useEffect(() => {
    if (!isCitySearchOpen) return;
    cityInputRef.current?.focus({ preventScroll: true });
  }, [isCitySearchOpen]);

  async function searchNearby(
    lat: number,
    lng: number,
  ): Promise<void> {
    setLoading(true);
    setError(null);
    setCinemas([]);
    setCenter({ lat, lng });

    try {
      const res = await fetch("/api/cinemas/nearby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng, radiusKm: DEFAULT_RADIUS_KM }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to search cinemas");
      }

      const data = (await res.json()) as NearbyCinemasResponse;
      setCinemas(data.cinemas);

      // Only show the map automatically if we actually have results.
      setShowMap(data.cinemas.length > 0);

      if (data.cinemas.length === 0) {
        setError("No cinemas found nearby. Try searching by city.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      setCinemas([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCitySearch(
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setCinemas([]);

    try {
      const geocodeRes = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city }),
      });

      if (!geocodeRes.ok) {
        const data = await geocodeRes.json();
        throw new Error(data.error || "City not found");
      }

      const geocode = (await geocodeRes.json()) as GeocodeResponse;
      await searchNearby(geocode.lat, geocode.lng);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      setCinemas([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full space-y-6 rounded-lg border border-secondary bg-card p-6">
      <div>
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <MapPin className="h-5 w-5" />
          Nearby Cinemas
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Find cinemas near you (within {DEFAULT_RADIUS_KM}km)
        </p>
      </div>

      {/* City Search Form */}
      {geolocationAttempted && (
        <div className="space-y-2 sm:max-w-xs">
          <button
            type="button"
            onClick={() => setIsCitySearchOpen((value) => !value)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed dark:text-zinc-200 dark:hover:bg-zinc-900"
            disabled={loading}
          >
            <Search className="h-4 w-4" />
            {isCitySearchOpen ? "Hide search" : "Search by city / postcode"}
          </button>

          {isCitySearchOpen && (
            <form onSubmit={handleCitySearch} className="flex flex-col gap-2 sm:flex-row">
              <input
                ref={cityInputRef}
                type="text"
                placeholder="Enter postcode or city name..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !city.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Search
              </button>
            </form>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && !geolocationAttempted && (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Finding cinemas near you...
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex gap-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Cinemas List */}
      {cinemas.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-muted-foreground">
              {cinemas.length} cinema{cinemas.length !== 1 ? "s" : ""} found
            </p>

            {center && (
              <button
                type="button"
                onClick={() => setShowMap((v) => !v)}
                className="text-sm font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
              >
                {showMap ? "Hide map" : "Show map"}
              </button>
            )}
          </div>

          {center && showMap && (
            <NearbyCinemasMap
              center={center}
              radiusKm={DEFAULT_RADIUS_KM}
              cinemas={cinemas}
            />
          )}

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {cinemas.map((cinema) => (
              <div
                key={cinema.id}
                className="w-full rounded-md border border-secondary bg-secondary/30 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="font-medium text-sm">{cinema.name}</div>
                  <a
                    href={googleMapsUrl(cinema.lat, cinema.lng, cinema.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 whitespace-nowrap"
                  >
                    Open map
                  </a>
                </div>
                {cinema.address && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {cinema.address}
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-1">
                  {cinema.distanceKm < 1
                    ? `${(cinema.distanceKm * 1000).toFixed(0)}m away`
                    : `${cinema.distanceKm.toFixed(1)}km away`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
