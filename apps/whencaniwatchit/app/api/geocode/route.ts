import { NextRequest, NextResponse } from "next/server";
import type { GeocodeRequest, GeocodeResponse } from "@/lib/types/cinemas";
import { geocodeCity } from "@/lib/osm";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
} as const;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as GeocodeRequest;

    if (!body.city || typeof body.city !== "string") {
      return NextResponse.json(
        { error: "City is required and must be a string" },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }

    const city = body.city.trim();

    if (city.length < 2) {
      return NextResponse.json(
        { error: "City name must be at least 2 characters" },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }

    const result = await geocodeCity(city);

    const response: GeocodeResponse = {
      lat: result.lat,
      lng: result.lng,
      displayName: result.displayName,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        // Allow shared caching for successful geocodes.
        "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    if (message.includes("No results found")) {
      return NextResponse.json(
        { error: message },
        { status: 404, headers: NO_STORE_HEADERS },
      );
    }

    console.error("Geocode error:", error);
    return NextResponse.json(
      { error: message },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
