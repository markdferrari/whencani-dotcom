import { getReviewedThisWeek } from '@/lib/opencritic';

export const dynamic = 'force-dynamic';

const SUCCESS_CACHE_CONTROL = 'public, s-maxage=86400, stale-while-revalidate=43200';

export async function GET() {
  try {
    const reviews = await getReviewedThisWeek(10);
    return new Response(JSON.stringify({ reviews }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': SUCCESS_CACHE_CONTROL,
      },
    });
  } catch (error) {
    console.error('Failed to fetch latest reviews:', error);
    return new Response(JSON.stringify({ reviews: [] }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  }
}
