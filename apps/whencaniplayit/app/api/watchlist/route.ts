import { NextResponse } from 'next/server';
import { getGamesByIds } from '@/lib/igdb';
import {
  WATCHLIST_COOKIE_NAME,
  addToWatchlist,
  parseWatchlistCookie,
  removeFromWatchlist,
  serializeWatchlist,
} from '@/lib/watchlist';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

type WatchlistAction = 'add' | 'remove';

function readWatchlistFromRequest(request: Request) {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const match = cookieHeader
    .split(';')
    .map((fragment) => fragment.trim())
    .find((fragment) => fragment.startsWith(`${WATCHLIST_COOKIE_NAME}=`));

  const value = match?.slice(`${WATCHLIST_COOKIE_NAME}=`.length);
  return parseWatchlistCookie(value);
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
  const ids = readWatchlistFromRequest(request);

  try {
    const games = await getGamesByIds(ids);
    return NextResponse.json({ ids, games });
  } catch (error) {
    console.error('Failed to fetch watchlist', error);
    return NextResponse.json({ ids, games: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  if (!payload) {
    return NextResponse.json({ message: 'Invalid payload' }, { status: 400 });
  }

  const action = payload.action as WatchlistAction | undefined;
  const gameId = Number(payload.gameId);

  if (!action || !['add', 'remove'].includes(action)) {
    return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
  }

  if (!Number.isFinite(gameId)) {
    return NextResponse.json({ message: 'Invalid game identifier' }, { status: 400 });
  }

  const currentIds = readWatchlistFromRequest(request);
  const updatedIds = action === 'add'
    ? addToWatchlist(currentIds, gameId)
    : removeFromWatchlist(currentIds, gameId);

  const response = NextResponse.json({
    ids: updatedIds,
    message: action === 'add' ? 'Added to watchlist' : 'Removed from watchlist',
    variant: 'success',
  });

  response.cookies.set(WATCHLIST_COOKIE_NAME, serializeWatchlist(updatedIds), cookieOptions());

  return response;
}
