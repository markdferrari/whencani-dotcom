import { NextResponse } from 'next/server';
import { getGamesByIds } from '@/lib/igdb';
import { getBoardGamesByIds } from '@/lib/bgg';
import {
  WATCHLIST_COOKIE_NAME,
  BOARD_GAME_WATCHLIST_COOKIE_NAME,
  addToWatchlist,
  parseWatchlistCookie,
  removeFromWatchlist,
  serializeWatchlist,
} from '@/lib/watchlist';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

type WatchlistAction = 'add' | 'remove';

function readWatchlistFromRequest(request: Request, cookieName = WATCHLIST_COOKIE_NAME) {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const match = cookieHeader
    .split(';')
    .map((fragment) => fragment.trim())
    .find((fragment) => fragment.startsWith(`${cookieName}=`));

  const value = match?.slice(`${cookieName}=`.length);
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
  const url = new URL(request.url);
  const type = url.searchParams.get('type') || 'video';
  const cookieName = type === 'board' ? BOARD_GAME_WATCHLIST_COOKIE_NAME : WATCHLIST_COOKIE_NAME;

  const ids = readWatchlistFromRequest(request, cookieName);

  try {
    const games = type === 'board' ? await getBoardGamesByIds(ids) : await getGamesByIds(ids);
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
  const type = (payload.type as string | undefined) || 'video';
  const cookieName = type === 'board' ? BOARD_GAME_WATCHLIST_COOKIE_NAME : WATCHLIST_COOKIE_NAME;

  if (!action || !['add', 'remove'].includes(action)) {
    return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
  }

  if (!Number.isFinite(gameId)) {
    return NextResponse.json({ message: 'Invalid game identifier' }, { status: 400 });
  }

  const currentIds = readWatchlistFromRequest(request, cookieName);
  const updatedIds = action === 'add'
    ? addToWatchlist(currentIds, gameId)
    : removeFromWatchlist(currentIds, gameId);

  const response = NextResponse.json({
    ids: updatedIds,
    message: action === 'add' ? 'Added to watchlist' : 'Removed from watchlist',
    variant: 'success',
  });

  response.cookies.set(cookieName, serializeWatchlist(updatedIds), cookieOptions());

  return response;
}
