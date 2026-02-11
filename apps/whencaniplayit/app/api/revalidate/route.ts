import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API route for manually revalidating cache tags
 *
 * Security: Uses a simple API key for authentication
 * Set REVALIDATE_SECRET in your environment variables
 *
 * Usage:
 * POST /api/revalidate
 * Headers: { "x-revalidate-secret": "your-secret" }
 * Body: { "tag": "opencritic-game-123" } or { "tags": ["tag1", "tag2"] }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Check for secret to confirm this is a valid request
    const secret = request.headers.get('x-revalidate-secret');
    const expectedSecret = process.env.REVALIDATE_SECRET;

    if (!expectedSecret) {
      return NextResponse.json(
        { error: 'Revalidation not configured. Set REVALIDATE_SECRET environment variable.' },
        { status: 500 }
      );
    }

    if (secret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Invalid secret' },
        { status: 401 }
      );
    }

    const body = await request.json() as { tag?: string; tags?: string[] };

    // Support both single tag and array of tags
    const tagsToRevalidate: string[] = [];

    if (body.tag && typeof body.tag === 'string') {
      tagsToRevalidate.push(body.tag);
    }

    if (body.tags && Array.isArray(body.tags)) {
      tagsToRevalidate.push(...body.tags.filter((t): t is string => typeof t === 'string'));
    }

    if (tagsToRevalidate.length === 0) {
      return NextResponse.json(
        { error: 'No valid tags provided. Use "tag" for single tag or "tags" for array.' },
        { status: 400 }
      );
    }

    // Revalidate each tag
    for (const tag of tagsToRevalidate) {
      revalidateTag(tag);
    }

    return NextResponse.json({
      revalidated: true,
      tags: tagsToRevalidate,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json(
      { error: 'Failed to revalidate', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Return available tags for documentation
export async function GET(): Promise<NextResponse> {
  const availableTags = {
    description: 'Cache revalidation endpoint for When Can I Play It',
    usage: {
      method: 'POST',
      endpoint: '/api/revalidate',
      headers: {
        'x-revalidate-secret': 'your-secret-from-env',
        'content-type': 'application/json',
      },
      body: {
        tag: 'single-tag-name',
        // OR
        tags: ['tag-1', 'tag-2'],
      },
    },
    availableTags: {
      opencritic: {
        all: 'opencritic',
        allGames: 'opencritic-games',
        specificGame: 'opencritic-game-{id}',
        reviewedThisWeek: 'opencritic-reviewed-this-week',
        recentlyReleased: 'opencritic-recently-released',
      },
      examples: [
        {
          description: 'Revalidate specific game',
          body: { tag: 'opencritic-game-123' },
        },
        {
          description: 'Revalidate all OpenCritic data',
          body: { tag: 'opencritic' },
        },
        {
          description: 'Revalidate multiple lists',
          body: {
            tags: ['opencritic-reviewed-this-week', 'opencritic-recently-released'],
          },
        },
      ],
    },
  };

  return NextResponse.json(availableTags, { status: 200 });
}
