import type { NearbyCinema } from "@/lib/types/cinemas";
import { config } from "./config";

type GooglePlacesNearbySearchResponse = {
  results?: Array<{
    place_id?: string;
    name?: string;
    vicinity?: string;
    geometry?: {
      location?: {
        lat?: number;
        lng?: number;
      };
    };
  }>;
  status?: string;
  error_message?: string;
};

export async function getNearbyCinemasGoogle(params: {
  lat: number;
  lng: number;
  radiusMeters: number;
  maxResults?: number;
}): Promise<NearbyCinema[]> {
  const { lat, lng, radiusMeters, maxResults = 20 } = params;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("Invalid coordinates");
  }

  if (!Number.isFinite(radiusMeters) || radiusMeters <= 0 || radiusMeters > 50_000) {
    throw new Error("Invalid radius");
  }

  const apiKey = config.google.mapsApiKey;
  if (!apiKey) {
    throw new Error("Google Places API key not configured");
  }

  const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
  url.searchParams.set("location", `${lat},${lng}`);
  url.searchParams.set("radius", `${Math.round(radiusMeters)}`);
  url.searchParams.set("type", "movie_theater");
  // Helps catch entries tagged differently in some locales.
  url.searchParams.set("keyword", "cinema");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString(), {
    // Cache for 24 hours (server-side)
    next: { revalidate: 24 * 60 * 60 },
  });

  if (!res.ok) {
    throw new Error(`Google Places request failed: ${res.status}`);
  }

  const data = (await res.json()) as GooglePlacesNearbySearchResponse;
  const status = data.status ?? "UNKNOWN";

  if (status === "ZERO_RESULTS") {
    return [];
  }

  if (status !== "OK") {
    const details = data.error_message ? `: ${data.error_message}` : "";
    throw new Error(`Google Places status ${status}${details}`);
  }

  const cinemas = (data.results ?? [])
    .map((r): NearbyCinema | null => {
      const placeId = r.place_id;
      const name = r.name;
      const rLat = r.geometry?.location?.lat;
      const rLng = r.geometry?.location?.lng;

      if (!placeId || !name || typeof rLat !== "number" || typeof rLng !== "number") {
        return null;
      }

      const distanceKm = haversineDistanceKm(lat, lng, rLat, rLng);

      return {
        id: `google:${placeId}`,
        name,
        lat: rLat,
        lng: rLng,
        address: r.vicinity,
        distanceKm: parseFloat(distanceKm.toFixed(1)),
      };
    })
    .filter((x): x is NearbyCinema => x !== null)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, maxResults);

  return cinemas;
}

function haversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
