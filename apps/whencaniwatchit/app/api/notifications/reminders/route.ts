import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getReminders } from '@/lib/notifications';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');

    if (!endpoint) {
      return NextResponse.json({ error: 'Missing endpoint parameter' }, { status: 400 });
    }

    const reminders = await getReminders(decodeURIComponent(endpoint));

    return NextResponse.json({ reminders });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
