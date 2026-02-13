import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { searchBooks } from '@/lib/google-books';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ results: [] });
  }

  try {
    const books = await searchBooks(query.trim(), 8);

    const results = books.map((book) => ({
      id: book.id,
      title: book.title,
      imageUrl: book.coverUrl,
      releaseDate: book.publishedDate,
      href: `/book/${book.id}`,
    }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
