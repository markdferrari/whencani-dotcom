import { getGameGenres, getUpcomingPSGames, getRecentlyReleasedGames, type IGDBPlatformFilter } from '@/lib/igdb';
import type { IGDBGame } from '@/lib/igdb';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const platformParam = searchParams.get('platform') || 'all';
  const view = searchParams.get('view') || 'upcoming';
  const genreParam = searchParams.get('genre');
  const studioParam = searchParams.get('studio');

  const platformFilter: IGDBPlatformFilter =
    platformParam === '6'
      ? { type: 'platform', id: 6 }
      : platformParam === 'all'
        ? { type: 'all' }
        : { type: 'family', id: parseInt(platformParam, 10) || 1 };

  const genreId = genreParam ? parseInt(genreParam, 10) : undefined;
  const parsedStudioId = studioParam ? parseInt(studioParam, 10) : undefined;
  const studioFilterId = typeof parsedStudioId === 'number' && !Number.isNaN(parsedStudioId) ? parsedStudioId : undefined;

  try {
    let games: IGDBGame[] = [];
    if (view === 'recent') {
      games = await getRecentlyReleasedGames(platformFilter, genreId, studioFilterId);
    } else {
      games = await getUpcomingPSGames(platformFilter, genreId, studioFilterId);
    }

    // Also fetch genre metadata so clients can map genre ids to names
    const genres = await getGameGenres().catch(() => []);

    return NextResponse.json({ games, view, genres });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch games';
    return NextResponse.json({ error: message, games: [], view }, { status: 500 });
  }
}
