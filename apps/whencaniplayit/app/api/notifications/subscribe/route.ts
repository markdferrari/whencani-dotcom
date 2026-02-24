import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { storeSubscription } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { subscription?: PushSubscriptionJSON };

    if (!body.subscription?.endpoint) {
      return NextResponse.json({ error: 'Missing subscription endpoint' }, { status: 400 });
    }

    await storeSubscription(body.subscription);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
