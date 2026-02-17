import { getHotBoardGames, getBoardGamesByIds } from '@/lib/bgg';

export const dynamic = 'force-dynamic';

const SUCCESS_CACHE_CONTROL = 'public, s-maxage=3600, stale-while-revalidate=1800';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const view = url.searchParams.get('view') || 'hot';

    // Currently we only support the BGG "hot" endpoint. Treat other
    // view values as a best-effort fallback to 'hot' so the client does
    // not receive a 400 Bad Request when requesting e.g. 'upcoming'.
    const hot = await getHotBoardGames(20);
    // enrich by fetching full thing details for the hot IDs (best-effort)
    const ids = hot.map((g) => g.id);
    const games = await getBoardGamesByIds(ids).catch(() => []);

    // derive categories
    const categories = Array.from(new Set(games.flatMap((g) => g.categories || []))).slice(0, 50);

    return new Response(JSON.stringify({ games, categories }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': SUCCESS_CACHE_CONTROL,
      },
    });
  } catch (error) {
    console.error('Failed to fetch board-games', error);
    return new Response(JSON.stringify({ games: [], categories: [] }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }
}
