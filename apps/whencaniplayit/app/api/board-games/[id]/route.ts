import { getBoardGameById } from '@/lib/bgg';

export const dynamic = 'force-dynamic';

const SUCCESS_CACHE_CONTROL = 'public, s-maxage=86400, stale-while-revalidate=43200';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const idParam = url.pathname.split('/').pop();
    const id = Number(idParam);
    if (!Number.isFinite(id)) {
      return new Response(JSON.stringify({ game: null }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const game = await getBoardGameById(id);
    if (!game) return new Response(JSON.stringify({ game: null }), { status: 404, headers: { 'Content-Type': 'application/json' } });

    return new Response(JSON.stringify({ game }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': SUCCESS_CACHE_CONTROL },
    });
  } catch (error) {
    console.error('Failed to fetch board-game by id', error);
    return new Response(JSON.stringify({ game: null }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }
}
