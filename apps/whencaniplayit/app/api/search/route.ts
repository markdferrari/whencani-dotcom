import { NextResponse } from 'next/server';
import { searchGames } from '../../../lib/igdb';
import { getHighResImageUrl } from '../../../lib/utils';
import { config } from '@/lib/config';
import { searchBoardGames, getBoardGamesByIds } from '@/lib/bgg';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const query = url.searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [] });
    }

    // Run IGDB search and (optionally) BGG search in parallel for lowest latency
    const igdbPromise = searchGames(query);
    const bggPromise = config.features.boardGames ? searchBoardGames(query) : Promise.resolve([]);

    const [igdbGames, bggSearchResults] = await Promise.all([igdbPromise, bggPromise]);

    const igdbResults = igdbGames.map((game) => ({
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

    let bggResults = [] as Array<{ id: number; title: string; imageUrl: string | null; releaseDate: string | null; href: string }>;

    if (bggSearchResults && bggSearchResults.length > 0) {
      // Fetch details for the top few BGG matches to get thumbnails
      const ids = bggSearchResults.slice(0, 6).map((r) => r.id);
      const details = await getBoardGamesByIds(ids);

      bggResults = details.map((g) => ({
        id: g.id,
        title: g.name,
        imageUrl: g.thumbnail ?? g.image ?? null,
        releaseDate: g.yearPublished ? String(g.yearPublished) : null,
        href: `/board-game/${g.id}`,
      }));
    }

    // Concatenate IGDB results first, then BGG results (UI uses href to distinguish)
    const results = [...igdbResults, ...bggResults].slice(0, 12);

    return NextResponse.json({ results });
  } catch (err) {
    console.error('search route error', err);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}

// Exported for unit testing the BGG -> SearchResult mapping
export function mapBGGDetailsToSearchResults(details: Array<any>) {
  return details.map((g) => ({
    id: g.id,
    title: g.name,
    imageUrl: g.thumbnail ?? g.image ?? null,
    releaseDate: g.yearPublished ? String(g.yearPublished) : null,
    href: `/board-game/${g.id}`,
  }));
}
