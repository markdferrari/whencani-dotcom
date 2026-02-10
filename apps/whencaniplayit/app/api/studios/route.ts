import { NextResponse } from 'next/server';
import { getDeveloperStudios } from '@/lib/igdb';

export async function GET() {
  const studios = await getDeveloperStudios();
  return NextResponse.json(studios);
}
