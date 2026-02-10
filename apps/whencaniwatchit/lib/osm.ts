import { unstable_cache } from "next/cache";

/**
 * Nominatim (OpenStreetMap) geocoding
 * Converts city name → { lat, lng, displayName }
 */
async function geocodeCityUncached(city: string): Promise<{
  lat: number;
  lng: number;
  displayName: string;
}> {
  if (!city || city.trim().length < 2) {
    throw new Error("City name must be at least 2 characters");
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", city);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": "WhenCanIWatchIt/1.0 (Next.js movie app)",
    },
    // Don't cache upstream failures in Next's fetch cache.
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Nominatim request failed: ${res.status}`);
  }

  const results = (await res.json()) as Array<{
    lat?: string;
    lon?: string;
    display_name?: string;
  }>;

  if (!results.length) {
    throw new Error(`No results found for city: ${city}`);
  }

  const result = results[0];
  const lat = parseFloat(result.lat ?? "0");
  const lng = parseFloat(result.lon ?? "0");

  if (!lat || !lng) {
    throw new Error(`Invalid coordinates for city: ${city}`);
  }

  return {
    lat,
    lng,
    displayName: result.display_name ?? city,
  };
}

/**
 * Cached wrapper: only successful results are cached.
 */
export const geocodeCity = unstable_cache(
  async (city: string) => geocodeCityUncached(city),
  ["geocodeCity"],
  { revalidate: 7 * 24 * 60 * 60 },
);

/**
 * Overpass (OpenStreetMap) cinema search
 * Returns cinemas within radius of lat/lng
 */
async function getCinemasNearbyUncached(params: {
  lat: number;
  lng: number;
  radiusKm: number;
}): Promise<
  {
    id: string;
    name: string;
    lat: number;
    lng: number;
    address?: string;
    distanceKm: number;
  }[]
> {
  const { lat, lng, radiusKm } = params;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("Invalid coordinates");
  }

  if (radiusKm <= 0 || radiusKm > 100) {
    throw new Error("Radius must be between 0 and 100 km");
  }

  const radiusMeters = radiusKm * 1000;

  // Overpass QL query for cinemas within radius.
  // Keep this intentionally small (nodes-only + limited output) to avoid 504s.
  // NOTE: We intentionally avoid ways/relations to keep the response small and
  // because we only need a nearby list.
  const query = `
[out:json][timeout:25];
(
  node["amenity"="cinema"](around:${Math.round(radiusMeters)},${lat},${lng});
);
out center tags 30;
  `.trim();

  const url = new URL("https://overpass-api.de/api/interpreter");

  const body = new URLSearchParams({ data: query }).toString();

  const res = await fetch(url.toString(), {
    method: "POST",
    body,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    // Don't cache upstream failures in Next's fetch cache.
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Overpass request failed: ${res.status}`);
  }

  const contentType = res.headers.get("content-type") ?? "";
  const rawText = await res.text();

  let data: {
    elements?: Array<{
      id: number;
      lat?: number;
      lon?: number;
      center?: { lat: number; lon: number };
      tags?: Record<string, string>;
    }>;
  };

  try {
    data = JSON.parse(rawText) as typeof data;
  } catch {
    const snippet = rawText.slice(0, 240).replaceAll(/\s+/g, " ").trim();
    throw new Error(
      `Overpass API returned non-JSON response (${contentType || "unknown"}). ` +
        `Likely rate-limited or query rejected. Response: ${snippet}`,
    );
  }

  if (!data.elements) {
    return [];
  }

  const cinemas = data.elements
    .map((element) => {
      const nodeLat = element.lat ?? element.center?.lat;
      const nodeLng = element.lon ?? element.center?.lon;

      if (nodeLat === undefined || nodeLng === undefined) {
        return null;
      }

      const distanceKm = haversineDistance(lat, lng, nodeLat, nodeLng);

      if (distanceKm > radiusKm) {
        return null;
      }

      return {
        id: `node/${element.id}`,
        name: element.tags?.name ?? `Cinema ${element.id}`,
        lat: nodeLat,
        lng: nodeLng,
        address: element.tags?.["addr:full"] ?? element.tags?.["addr:street"],
        distanceKm: parseFloat(distanceKm.toFixed(1)),
      };
    })
    .filter(Boolean) as Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
    address?: string;
    distanceKm: number;
  }>;

  // Sort by distance ascending
  cinemas.sort((a, b) => a.distanceKm - b.distanceKm);

  return cinemas;
}

/**
 * Cached wrapper: only successful results are cached.
 */
export const getCinemasNearby = unstable_cache(
  async (params: { lat: number; lng: number; radiusKm: number }) =>
    getCinemasNearbyUncached(params),
  ["getCinemasNearby"],
  { revalidate: 24 * 60 * 60 },
);

/**
 * Haversine formula: distance between two lat/lng points
 */
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Earth radius in km
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
