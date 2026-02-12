import { NextResponse } from 'next/server';
import { searchMovies, getPosterUrl, formatReleaseDate } from '../../../lib/tmdb';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const query = url.searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [] });
    }

    const movies = await searchMovies(query);
    const results = movies.map((movie) => ({
      id: movie.id,
      title: movie.title,
      imageUrl: getPosterUrl(movie.poster_path, 'w92'),
      releaseDate: formatReleaseDate(movie.release_date),
      href: `/movie/${movie.id}`,
    }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
