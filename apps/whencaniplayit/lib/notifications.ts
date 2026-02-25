import crypto from 'crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { ActiveReminder, NotificationApp, ReminderItemType, ReminderTiming } from '@whencani/ui';

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

function getTableName(): string {
  return process.env.NOTIFICATIONS_TABLE_NAME ?? 'notifications';
}

export interface StoredReminder {
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
  gsi1pk: string;
  gsi1sk: string;
}

function hashEndpoint(endpoint: string): string {
  return crypto.createHash('sha256').update(endpoint).digest('hex').slice(0, 16);
}

export function computeRemindAt(releaseDate: string, timing: ReminderTiming): string {
  if (releaseDate === 'TBA') return 'TBA';

  const date = new Date(releaseDate);
  if (timing === '1d') {
    date.setDate(date.getDate() - 1);
  } else if (timing === '1w') {
    date.setDate(date.getDate() - 7);
  }
  return date.toISOString().split('T')[0];
}

export async function storeSubscription(subscription: PushSubscriptionJSON): Promise<string> {
  const endpointHash = hashEndpoint(subscription.endpoint ?? '');

  await docClient.send(new PutCommand({
    TableName: getTableName(),
    Item: {
      pk: `PUSH#${endpointHash}`,
      sk: 'SUBSCRIPTION',
      subscription,
      createdAt: new Date().toISOString(),
      gsi1pk: 'SUBSCRIPTION',
      gsi1sk: `PUSH#${endpointHash}`,
    },
  }));

  return endpointHash;
}

export async function storeReminder(
  subscription: PushSubscriptionJSON,
  itemId: string | number,
  itemType: ReminderItemType,
  itemTitle: string,
  releaseDate: string,
  timing: ReminderTiming,
  app: NotificationApp,
): Promise<StoredReminder> {
  const endpointHash = hashEndpoint(subscription.endpoint ?? '');
  const sk = `REMINDER#${itemId}#${timing}`;
  const remindAt = computeRemindAt(releaseDate, timing);

  const reminder: StoredReminder = {
    pk: `PUSH#${endpointHash}`,
    sk,
    subscription,
    itemId,
    itemType,
    itemTitle,
    releaseDate,
    remindAt,
    timing,
    app,
    createdAt: new Date().toISOString(),
    // GSI for querying due reminders by date
    gsi1pk: `REMIND_AT#${remindAt}`,
    gsi1sk: `${app}#${endpointHash}#${itemId}`,
  };

  await docClient.send(new PutCommand({
    TableName: getTableName(),
    Item: reminder,
  }));

  return reminder;
}

export async function deleteReminders(subscription: PushSubscriptionJSON, itemId: string | number): Promise<number> {
  const endpointHash = hashEndpoint(subscription.endpoint ?? '');
  const pk = `PUSH#${endpointHash}`;

  // Query all reminders for this subscription + item
  const result = await docClient.send(new QueryCommand({
    TableName: getTableName(),
    KeyConditionExpression: 'pk = :pk AND begins_with(sk, :skPrefix)',
    ExpressionAttributeValues: {
      ':pk': pk,
      ':skPrefix': `REMINDER#${itemId}#`,
    },
  }));

  const items = result.Items ?? [];

  // Delete each matching reminder
  for (const item of items) {
    await docClient.send(new DeleteCommand({
      TableName: getTableName(),
      Key: { pk: item.pk as string, sk: item.sk as string },
    }));
  }

  return items.length;
}

export async function getReminders(endpoint: string): Promise<ActiveReminder[]> {
  const endpointHash = hashEndpoint(endpoint);
  const pk = `PUSH#${endpointHash}`;

  const result = await docClient.send(new QueryCommand({
    TableName: getTableName(),
    KeyConditionExpression: 'pk = :pk AND begins_with(sk, :skPrefix)',
    ExpressionAttributeValues: {
      ':pk': pk,
      ':skPrefix': 'REMINDER#',
    },
  }));

  return (result.Items ?? []).map((item) => ({
    itemId: item.itemId as string | number,
    itemType: item.itemType as ReminderItemType,
    timing: item.timing as ReminderTiming,
    remindAt: item.remindAt as string,
  }));
}

export async function getDueReminders(today: string): Promise<StoredReminder[]> {
  // Query the GSI for all reminders due on or before today
  // We scan dates up to and including today
  const results: StoredReminder[] = [];

  // Query for exact date match first, then scan for older ones
  // For efficiency, query the main table filtering by remindAt
  const result = await docClient.send(new QueryCommand({
    TableName: getTableName(),
    IndexName: 'gsi1',
    KeyConditionExpression: 'gsi1pk = :gsi1pk',
    ExpressionAttributeValues: {
      ':gsi1pk': `REMIND_AT#${today}`,
    },
  }));

  for (const item of result.Items ?? []) {
    results.push(item as unknown as StoredReminder);
  }

  return results;
}

export async function deleteReminderByKey(pk: string, sk: string): Promise<boolean> {
  try {
    await docClient.send(new DeleteCommand({
      TableName: getTableName(),
      Key: { pk, sk },
    }));
    return true;
  } catch {
    return false;
  }
}
