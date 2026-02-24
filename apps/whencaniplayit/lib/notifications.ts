import crypto from 'crypto';
import type { ActiveReminder, NotificationApp, ReminderItemType, ReminderTiming } from '@whencani/ui';

/**
 * In-memory store for push reminders.
 * In production this will be replaced with DynamoDB.
 * For now, this provides a working implementation that persists for the lifetime of the server process.
 */

interface StoredReminder {
  pk: string;
  sk: string;
  subscription: PushSubscriptionJSON;
  itemId: string | number;
  itemType: ReminderItemType;
  itemTitle: string;
  releaseDate: string;
  remindAt: string;
  timing: ReminderTiming;
  app: NotificationApp;
  createdAt: string;
}

// In-memory store — replaced with DynamoDB in production
const reminders = new Map<string, StoredReminder>();

function hashEndpoint(endpoint: string): string {
  return crypto.createHash('sha256').update(endpoint).digest('hex').slice(0, 16);
}

function makeKey(endpointHash: string, itemId: string | number, timing: ReminderTiming): string {
  return `${endpointHash}:${itemId}:${timing}`;
}

export function computeRemindAt(releaseDate: string, timing: ReminderTiming): string {
  if (releaseDate === 'TBA') return 'TBA';

  const date = new Date(releaseDate);
  if (timing === '1d') {
    date.setDate(date.getDate() - 1);
  } else if (timing === '1w') {
    date.setDate(date.getDate() - 7);
  }
  // For 'release', remindAt === releaseDate
  return date.toISOString().split('T')[0];
}

export function storeSubscription(subscription: PushSubscriptionJSON): string {
  // Return the endpoint hash for later reference
  return hashEndpoint(subscription.endpoint ?? '');
}

export function storeReminder(
  subscription: PushSubscriptionJSON,
  itemId: string | number,
  itemType: ReminderItemType,
  itemTitle: string,
  releaseDate: string,
  timing: ReminderTiming,
  app: NotificationApp,
): StoredReminder {
  const endpointHash = hashEndpoint(subscription.endpoint ?? '');
  const sk = `REMINDER#${itemId}#${timing}`;
  const key = makeKey(endpointHash, itemId, timing);

  const reminder: StoredReminder = {
    pk: `PUSH#${endpointHash}`,
    sk,
    subscription,
    itemId,
    itemType,
    itemTitle,
    releaseDate,
    remindAt: computeRemindAt(releaseDate, timing),
    timing,
    app,
    createdAt: new Date().toISOString(),
  };

  reminders.set(key, reminder);
  return reminder;
}

export function deleteReminders(subscription: PushSubscriptionJSON, itemId: string | number): number {
  const endpointHash = hashEndpoint(subscription.endpoint ?? '');
  let count = 0;

  for (const [key, reminder] of reminders.entries()) {
    if (reminder.pk === `PUSH#${endpointHash}` && String(reminder.itemId) === String(itemId)) {
      reminders.delete(key);
      count++;
    }
  }

  return count;
}

export function getReminders(endpoint: string): ActiveReminder[] {
  const endpointHash = hashEndpoint(endpoint);
  const results: ActiveReminder[] = [];

  for (const reminder of reminders.values()) {
    if (reminder.pk === `PUSH#${endpointHash}`) {
      results.push({
        itemId: reminder.itemId,
        itemType: reminder.itemType,
        timing: reminder.timing,
        remindAt: reminder.remindAt,
      });
    }
  }

  return results;
}

export function getDueReminders(today: string): StoredReminder[] {
  const results: StoredReminder[] = [];

  for (const reminder of reminders.values()) {
    if (reminder.remindAt !== 'TBA' && reminder.remindAt <= today) {
      results.push(reminder);
    }
  }

  return results;
}

export function deleteReminderByKey(pk: string, sk: string): boolean {
  for (const [key, reminder] of reminders.entries()) {
    if (reminder.pk === pk && reminder.sk === sk) {
      reminders.delete(key);
      return true;
    }
  }
  return false;
}
