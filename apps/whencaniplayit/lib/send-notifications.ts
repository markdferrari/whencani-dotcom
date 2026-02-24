import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import webPush from 'web-push';

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

interface StoredReminder {
  pk: string;
  sk: string;
  subscription: PushSubscriptionJSON;
  itemId: string | number;
  itemType: 'movie' | 'game' | 'book';
  itemTitle: string;
  releaseDate: string;
  remindAt: string;
  timing: string;
  app: string;
}

interface PushPayload {
  title: string;
  body: string;
  icon: string;
  url: string;
  tag: string;
}

function getTableName(): string {
  return process.env.NOTIFICATIONS_TABLE_NAME ?? 'notifications';
}

function getAppUrl(app: string): string {
  switch (app) {
    case 'whencaniplayit': return 'https://whencaniplayit.com';
    case 'whencaniwatchit': return 'https://whencaniwatchit.com';
    case 'whencanireadit': return 'https://whencanireadit.com';
    default: return 'https://whencaniplayit.com';
  }
}

function getDetailPath(app: string, itemId: string | number): string {
  switch (app) {
    case 'whencaniplayit': return `/game/${itemId}`;
    case 'whencaniwatchit': return `/movie/${itemId}`;
    case 'whencanireadit': return `/book/${itemId}`;
    default: return `/`;
  }
}

function getEmoji(itemType: string): string {
  switch (itemType) {
    case 'game': return '\uD83C\uDFAE';
    case 'movie': return '\uD83C\uDFAC';
    case 'book': return '\uD83D\uDCDA';
    default: return '\uD83D\uDD14';
  }
}

function buildNotificationBody(reminder: StoredReminder): string {
  const today = new Date().toISOString().split('T')[0];
  const isReleaseDay = reminder.releaseDate === today || reminder.timing === 'release';

  if (isReleaseDay) {
    switch (reminder.itemType) {
      case 'game': return 'Tap to see reviews and where to buy.';
      case 'movie': return 'Tap to check showtimes and details.';
      case 'book': return 'Tap to see reviews and where to buy.';
      default: return 'Tap for details.';
    }
  }

  switch (reminder.itemType) {
    case 'game': return 'Tap to see details and where to pre-order.';
    case 'movie': return 'Tap to check details and plan ahead.';
    case 'book': return 'Tap to see details and where to pre-order.';
    default: return 'Tap for details.';
  }
}

function buildNotificationTitle(reminder: StoredReminder): string {
  const today = new Date().toISOString().split('T')[0];
  const emoji = getEmoji(reminder.itemType);

  if (reminder.releaseDate === today || reminder.timing === 'release') {
    return `${emoji} ${reminder.itemTitle} is out today!`;
  }

  if (reminder.timing === '1d') {
    return `${emoji} ${reminder.itemTitle} releases tomorrow!`;
  }

  return `${emoji} ${reminder.itemTitle} releases in one week!`;
}

async function getDueReminders(today: string): Promise<StoredReminder[]> {
  const tableName = getTableName();

  // Query GSI for reminders due today
  const todayResult = await docClient.send(new QueryCommand({
    TableName: tableName,
    IndexName: 'gsi1',
    KeyConditionExpression: 'gsi1pk = :gsi1pk',
    ExpressionAttributeValues: {
      ':gsi1pk': `REMIND_AT#${today}`,
    },
  }));

  const results = (todayResult.Items ?? []) as unknown as StoredReminder[];

  // Also scan for any overdue reminders (missed days)
  const scanResult = await docClient.send(new ScanCommand({
    TableName: tableName,
    FilterExpression: 'begins_with(sk, :reminderPrefix) AND remindAt < :today AND remindAt <> :tba',
    ExpressionAttributeValues: {
      ':reminderPrefix': 'REMINDER#',
      ':today': today,
      ':tba': 'TBA',
    },
  }));

  for (const item of scanResult.Items ?? []) {
    results.push(item as unknown as StoredReminder);
  }

  return results;
}

export async function handler(): Promise<{ sent: number; failed: number; errors: string[] }> {
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY ?? '';
  const vapidSubject = process.env.VAPID_SUBJECT ?? '';

  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    console.error('Missing VAPID configuration');
    return { sent: 0, failed: 0, errors: ['Missing VAPID configuration'] };
  }

  webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const today = new Date().toISOString().split('T')[0];
  const reminders = await getDueReminders(today);

  console.log(`Found ${reminders.length} due reminders for ${today}`);

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const reminder of reminders) {
    const appUrl = getAppUrl(reminder.app);
    const detailPath = getDetailPath(reminder.app, reminder.itemId);

    const payload: PushPayload = {
      title: buildNotificationTitle(reminder),
      body: buildNotificationBody(reminder),
      icon: '/icon-192x192.png',
      url: `${appUrl}${detailPath}`,
      tag: `reminder-${reminder.itemId}`,
    };

    try {
      const subscription = reminder.subscription;

      if (!subscription.endpoint) {
        console.warn(`Skipping reminder ${reminder.sk} — no endpoint`);
        continue;
      }

      const pushSubscription: webPush.PushSubscription = {
        endpoint: subscription.endpoint ?? '',
        keys: (subscription.keys as { p256dh: string; auth: string }) ?? { p256dh: '', auth: '' },
      };

      await webPush.sendNotification(
        pushSubscription,
        JSON.stringify(payload),
      );

      sent++;
      console.log(`Sent notification for ${reminder.itemTitle} to ${reminder.pk}`);
    } catch (err: unknown) {
      failed++;
      const statusCode = (err as { statusCode?: number })?.statusCode;
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${reminder.sk}: ${message}`);

      // 404 or 410 means the subscription is expired/invalid — clean up
      if (statusCode === 404 || statusCode === 410) {
        console.log(`Subscription expired for ${reminder.pk}, cleaning up`);
      }
    }

    // Delete the reminder after attempting to send (whether success or failure)
    try {
      await docClient.send(new DeleteCommand({
        TableName: getTableName(),
        Key: { pk: reminder.pk, sk: reminder.sk },
      }));
    } catch (deleteErr) {
      console.error(`Failed to delete reminder ${reminder.pk}/${reminder.sk}:`, deleteErr);
    }
  }

  console.log(`Done: ${sent} sent, ${failed} failed`);
  return { sent, failed, errors };
}
