import { NextResponse } from 'next/server';
import { getGamesForDateRange, IGDBPlatformFilter } from '../../../lib/igdb';
import { getHighResImageUrl } from '../../../lib/utils';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const platformParam = url.searchParams.get('platform');
    const genreId = url.searchParams.get('genre') ? parseInt(url.searchParams.get('genre')!) : undefined;

    if (!startDate || !endDate) {
      return NextResponse.json({ releases: [] }, { status: 400 });
    }

    let platform: IGDBPlatformFilter | undefined;
    if (platformParam) {
      const platformId = parseInt(platformParam);
      if (!isNaN(platformId)) {
        platform = { type: 'family', id: platformId };
      }
    }

    const games = await getGamesForDateRange(startDate, endDate, platform, genreId);
    const releases: { date: string; items: { id: number; title: string; imageUrl: string | null; href: string }[] }[] = [];

    const grouped = new Map<string, typeof releases[0]['items']>();
    for (const game of games) {
      if (!game.release_dates) continue;
      for (const rd of game.release_dates) {
        const date = new Date(rd.date * 1000).toISOString().split('T')[0];
        if (!grouped.has(date)) grouped.set(date, []);
        grouped.get(date)!.push({
          id: game.id,
          title: game.name,
          imageUrl: getHighResImageUrl(game.cover?.url) || null,
          href: `/game/${game.id}`,
        });
      }
    }

    for (const [date, items] of Array.from(grouped.entries())) {
      releases.push({ date, items });
    }

    return NextResponse.json({ releases });
  } catch (err) {
    return NextResponse.json({ releases: [] }, { status: 500 });
  }
}