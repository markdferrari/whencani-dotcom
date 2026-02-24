'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ActiveReminder, CreateReminderRequest, DeleteReminderRequest, ReminderTiming } from '../types/notifications';

type NotificationPermission = 'default' | 'granted' | 'denied';

interface UseNotificationsOptions {
  /** The VAPID public key for push subscriptions */
  vapidPublicKey: string;
  /** Whether the notifications feature is enabled */
  enabled?: boolean;
}

interface UseNotificationsReturn {
  /** Current notification permission state */
  permission: NotificationPermission;
  /** Whether push is supported in this browser */
  isSupported: boolean;
  /** Whether we're currently loading reminders */
  isLoading: boolean;
  /** Active reminders for the current subscription */
  reminders: ActiveReminder[];
  /** Whether a specific item has an active reminder */
  hasReminder: (itemId: string | number) => boolean;
  /** Set a reminder for an item */
  setReminder: (request: Omit<CreateReminderRequest, 'timing'> & { timing: ReminderTiming }) => Promise<boolean>;
  /** Remove all reminders for an item */
  removeReminder: (itemId: string | number) => Promise<boolean>;
  /** Request notification permission */
  requestPermission: () => Promise<NotificationPermission>;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray as Uint8Array<ArrayBuffer>;
}

export function useNotifications({ vapidPublicKey, enabled = true }: UseNotificationsOptions): UseNotificationsReturn {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [reminders, setReminders] = useState<ActiveReminder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const subscriptionRef = useRef<PushSubscription | null>(null);

  const isSupported = typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;

  // Sync permission state
  useEffect(() => {
    if (!isSupported || !enabled) return;
    setPermission(Notification.permission as NotificationPermission);
  }, [isSupported, enabled]);

  // Get or create push subscription
  const getSubscription = useCallback(async (): Promise<PushSubscription | null> => {
    if (subscriptionRef.current) return subscriptionRef.current;
    if (!isSupported || !enabled) return null;

    try {
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });

        // Store subscription on server
        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: subscription.toJSON() }),
        });
      }

      subscriptionRef.current = subscription;
      return subscription;
    } catch {
      return null;
    }
  }, [isSupported, enabled, vapidPublicKey]);

  // Load active reminders
  const loadReminders = useCallback(async () => {
    if (!isSupported || !enabled) return;

    try {
      const subscription = await getSubscription();
      if (!subscription) return;

      setIsLoading(true);
      const endpoint = encodeURIComponent(subscription.endpoint);
      const res = await fetch(`/api/notifications/reminders?endpoint=${endpoint}`);
      if (res.ok) {
        const data = await res.json() as { reminders: ActiveReminder[] };
        setReminders(data.reminders);
      }
    } catch {
      // Silently fail — reminders are non-critical
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, enabled, getSubscription]);

  // Load reminders when permission is granted
  useEffect(() => {
    if (permission === 'granted' && enabled) {
      void loadReminders();
    }
  }, [permission, enabled, loadReminders]);

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) return 'denied';

    const result = await Notification.requestPermission();
    setPermission(result as NotificationPermission);
    return result as NotificationPermission;
  }, [isSupported]);

  const setReminder = useCallback(async (request: CreateReminderRequest): Promise<boolean> => {
    try {
      let currentPermission = permission;
      if (currentPermission === 'default') {
        currentPermission = await requestPermission();
      }
      if (currentPermission !== 'granted') return false;

      const subscription = await getSubscription();
      if (!subscription) return false;

      const res = await fetch('/api/notifications/remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...request,
          subscription: subscription.toJSON(),
        }),
      });

      if (res.ok) {
        await loadReminders();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [permission, requestPermission, getSubscription, loadReminders]);

  const removeReminder = useCallback(async (itemId: string | number): Promise<boolean> => {
    try {
      const subscription = await getSubscription();
      if (!subscription) return false;

      const body: DeleteReminderRequest & { subscription: PushSubscriptionJSON } = {
        itemId,
        subscription: subscription.toJSON(),
      };

      const res = await fetch('/api/notifications/remind', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setReminders((prev) => prev.filter((r) => String(r.itemId) !== String(itemId)));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [getSubscription]);

  const hasReminder = useCallback(
    (itemId: string | number) => reminders.some((r) => String(r.itemId) === String(itemId)),
    [reminders],
  );

  return useMemo(
    () => ({
      permission,
      isSupported,
      isLoading,
      reminders,
      hasReminder,
      setReminder,
      removeReminder,
      requestPermission,
    }),
    [permission, isSupported, isLoading, reminders, hasReminder, setReminder, removeReminder, requestPermission],
  );
}
