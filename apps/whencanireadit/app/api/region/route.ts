import { NextResponse } from 'next/server';
import { REGION_COOKIE_NAME, isValidRegion, type Region } from '@/lib/region';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function cookieOptions() {
  return {
    path: '/',
    maxAge: COOKIE_MAX_AGE,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false,
  };
}

interface RegionPayload {
  region?: string;
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as RegionPayload | null;
  const raw = payload?.region;

  if (!raw || !isValidRegion(raw.toUpperCase())) {
    return NextResponse.json({ message: 'Invalid region' }, { status: 400 });
  }

  const region = raw.toUpperCase() as Region;
  const response = NextResponse.json({ region });
  response.cookies.set(REGION_COOKIE_NAME, region, cookieOptions());
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ region: null });
  response.cookies.set(REGION_COOKIE_NAME, '', { ...cookieOptions(), maxAge: 0 });
  return response;
}
