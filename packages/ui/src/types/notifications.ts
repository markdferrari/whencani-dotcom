/** Timing options for push notification reminders */
export type ReminderTiming = '1d' | '1w' | 'release';

/** The type of item being reminded about */
export type ReminderItemType = 'movie' | 'game' | 'book';

/** App identifier for routing notifications */
export type NotificationApp = 'whencaniwatchit' | 'whencaniplayit' | 'whencanireadit';

/** A push notification reminder stored in the backend */
export interface PushReminder {
  pk: string;
  sk: string;
  subscription: PushSubscriptionJSON;
  itemId: string | number;
  itemType: ReminderItemType;
  itemTitle: string;
  releaseDate: string;
  remindAt: string;
  app: NotificationApp;
  createdAt: string;
}

/** Request body for creating a reminder */
export interface CreateReminderRequest {
  itemId: string | number;
  itemTitle: string;
  itemType: ReminderItemType;
  releaseDate: string | null;
  timing: ReminderTiming;
}

/** Request body for subscribing to push notifications */
export interface SubscribeRequest {
  subscription: PushSubscriptionJSON;
}

/** Request body for deleting a reminder */
export interface DeleteReminderRequest {
  itemId: string | number;
}

/** Active reminder returned from the API */
export interface ActiveReminder {
  itemId: string | number;
  itemType: ReminderItemType;
  timing: ReminderTiming;
  remindAt: string;
}

/** API response for listing active reminders */
export interface RemindersResponse {
  reminders: ActiveReminder[];
}

/** Timing option displayed in the UI */
export interface TimingOption {
  label: string;
  value: ReminderTiming;
  description: string;
}

/** Standard timing options for items with known release dates */
export const TIMING_OPTIONS: TimingOption[] = [
  { label: '1 day before', value: '1d', description: 'Get notified the day before release' },
  { label: '1 week before', value: '1w', description: 'Get notified a week before release' },
  { label: 'On release day', value: 'release', description: 'Get notified on the day of release' },
];
