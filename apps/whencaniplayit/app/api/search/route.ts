import { NextResponse } from 'next/server';
import { searchGames } from '../../../lib/igdb';
import { getHighResImageUrl } from '../../../lib/utils';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const query = url.searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [] });
    }

    const games = await searchGames(query);
    const results = games.map((game) => ({
      id: game.id,
      title: game.name,
      imageUrl: getHighResImageUrl(game.cover?.url) ?? null,
      releaseDate: game.first_release_date
        ? new Date(game.first_release_date * 1000).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        : null,
      href: `/game/${game.id}`,
    }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
