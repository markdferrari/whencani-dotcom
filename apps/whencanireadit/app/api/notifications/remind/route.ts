import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { storeReminder, deleteReminders } from '@/lib/notifications';
import type { ReminderItemType, ReminderTiming } from '@whencani/ui';

interface RemindRequestBody {
  itemId: string | number;
  itemTitle: string;
  itemType: ReminderItemType;
  releaseDate: string;
  timing: ReminderTiming;
  subscription: PushSubscriptionJSON;
}

interface DeleteRequestBody {
  itemId: string | number;
  subscription: PushSubscriptionJSON;
}

const VALID_TIMINGS: ReminderTiming[] = ['1d', '1w', 'release'];
const VALID_ITEM_TYPES: ReminderItemType[] = ['movie', 'game', 'book'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as RemindRequestBody;

    if (!body.itemId || !body.itemTitle || !body.itemType || !body.timing || !body.subscription?.endpoint) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!VALID_TIMINGS.includes(body.timing)) {
      return NextResponse.json({ error: 'Invalid timing value' }, { status: 400 });
    }

    if (!VALID_ITEM_TYPES.includes(body.itemType)) {
      return NextResponse.json({ error: 'Invalid item type' }, { status: 400 });
    }

    const reminder = storeReminder(
      body.subscription,
      body.itemId,
      body.itemType,
      body.itemTitle,
      body.releaseDate ?? 'TBA',
      body.timing,
      'whencanireadit',
    );

    return NextResponse.json({ success: true, remindAt: reminder.remindAt });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json() as DeleteRequestBody;

    if (!body.itemId || !body.subscription?.endpoint) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const count = deleteReminders(body.subscription, body.itemId);

    return NextResponse.json({ success: true, deleted: count });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
