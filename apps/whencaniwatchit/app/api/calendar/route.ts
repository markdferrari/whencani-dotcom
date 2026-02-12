import { NextResponse } from 'next/server';
import { getMoviesForDateRange, getPosterUrl } from '../../../lib/tmdb';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const genreId = url.searchParams.get('genre') ? parseInt(url.searchParams.get('genre')!) : undefined;

    if (!startDate || !endDate) {
      return NextResponse.json({ releases: [] }, { status: 400 });
    }

    const movies = await getMoviesForDateRange(startDate, endDate, genreId);
    const releases: { date: string; items: { id: number; title: string; imageUrl: string | null; href: string }[] }[] = [];

    const grouped = new Map<string, typeof releases[0]['items']>();
    for (const movie of movies) {
      if (!movie.release_date) continue;
      const date = movie.release_date;
      if (!grouped.has(date)) grouped.set(date, []);
      grouped.get(date)!.push({
        id: movie.id,
        title: movie.title,
        imageUrl: getPosterUrl(movie.poster_path, 'w500'),
        href: `/movie/${movie.id}`,
      });
    }

    for (const [date, items] of Array.from(grouped.entries())) {
      releases.push({ date, items });
    }

    return NextResponse.json({ releases });
  } catch (err) {
    return NextResponse.json({ releases: [] }, { status: 500 });
  }
}