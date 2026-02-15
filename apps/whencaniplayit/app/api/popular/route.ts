import { getPopularGames } from '@/lib/igdb';

export const dynamic = 'force-dynamic';

const SUCCESS_CACHE_CONTROL = 'public, s-maxage=3600, stale-while-revalidate=1800'; // Cache for 1 hour

export async function GET() {
  try {
    console.log('API: Fetching popular games...');
    const games = await getPopularGames(20); // Get top 20 popular games
    console.log('API: Got', games.length, 'games');
    return new Response(JSON.stringify({ games }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': SUCCESS_CACHE_CONTROL,
      },
    });
  } catch (error) {
    console.error('Failed to fetch popular games:', error);
    return new Response(JSON.stringify({ games: [] }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  }
}