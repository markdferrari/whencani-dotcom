import { getHotBoardGames } from '@/lib/bgg';

export const dynamic = 'force-dynamic';

const SUCCESS_CACHE_CONTROL = 'public, s-maxage=3600, stale-while-revalidate=1800';

export async function GET() {
  try {
    const games = await getHotBoardGames(20);
    return new Response(JSON.stringify({ games }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': SUCCESS_CACHE_CONTROL,
      },
    });
  } catch (error) {
    console.error('Failed to fetch BGG hot list', error);
    return new Response(JSON.stringify({ games: [] }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }
}
