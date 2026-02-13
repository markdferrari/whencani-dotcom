import { NextResponse } from 'next/server';
import {
  BOOKSHELF_COOKIE_NAME,
  addToBookshelf,
  parseBookshelfCookie,
  removeFromBookshelf,
  serializeBookshelf,
} from '@/lib/bookshelf';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

type BookshelfAction = 'add' | 'remove';

function readBookshelfFromRequest(request: Request): string[] {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const match = cookieHeader
    .split(';')
    .map((fragment) => fragment.trim())
    .find((fragment) => fragment.startsWith(`${BOOKSHELF_COOKIE_NAME}=`));

  const value = match?.slice(`${BOOKSHELF_COOKIE_NAME}=`.length);
  return parseBookshelfCookie(value);
}

function cookieOptions() {
  return {
    path: '/',
    maxAge: COOKIE_MAX_AGE,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false,
  } as const;
}

export async function GET(request: Request) {
  const ids = readBookshelfFromRequest(request);
  return NextResponse.json({ ids });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  if (!payload) {
    return NextResponse.json({ message: 'Invalid payload' }, { status: 400 });
  }

  const action = payload.action as BookshelfAction | undefined;
  const bookId = payload.bookId as string | undefined;

  if (!action || !['add', 'remove'].includes(action)) {
    return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
  }

  if (typeof bookId !== 'string' || bookId.length === 0) {
    return NextResponse.json({ message: 'Invalid book identifier' }, { status: 400 });
  }

  const currentIds = readBookshelfFromRequest(request);
  const updatedIds = action === 'add'
    ? addToBookshelf(currentIds, bookId)
    : removeFromBookshelf(currentIds, bookId);

  const response = NextResponse.json({
    ids: updatedIds,
    message: action === 'add' ? 'Added to bookshelf' : 'Removed from bookshelf',
    variant: 'success',
  });

  response.cookies.set(BOOKSHELF_COOKIE_NAME, serializeBookshelf(updatedIds), cookieOptions());

  return response;
}
