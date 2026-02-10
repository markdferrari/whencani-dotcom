import { NextRequest, NextResponse } from "next/server";
import type {
  NearbyCinemasRequest,
  NearbyCinemasResponse,
} from "@/lib/types/cinemas";
import { getCinemasNearby } from "@/lib/osm";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
} as const;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as NearbyCinemasRequest;

    // Validate required fields
    if (
      typeof body.lat !== "number" ||
      typeof body.lng !== "number" ||
      typeof body.radiusKm !== "number"
    ) {
      return NextResponse.json(
        {
          error:
            "lat, lng, and radiusKm are required and must be numbers",
        },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }

    if (!Number.isFinite(body.lat) || !Number.isFinite(body.lng)) {
      return NextResponse.json(
        { error: "lat and lng must be valid numbers" },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }

    if (body.radiusKm <= 0 || body.radiusKm > 100) {
      return NextResponse.json(
        { error: "radiusKm must be between 0 and 100" },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }

    // Hard cap radius to keep Overpass queries fast/reliable.
    const radiusKm = Math.min(body.radiusKm, 10);

    const cinemas = await getCinemasNearby({
      lat: body.lat,
      lng: body.lng,
      radiusKm,
    });

    const response: NearbyCinemasResponse = {
      cinemas,
      count: cinemas.length,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        // Allow shared caching for successful nearby lookups.
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    console.error("Nearby cinemas error:", error);
    return NextResponse.json(
      { error: message },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
