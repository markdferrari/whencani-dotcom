'use client';

import { Bell, BellRing, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { useNotifications } from '../hooks/use-notifications';
import { useToast } from './toast-provider';
import { TIMING_OPTIONS } from '../types/notifications';
import type { ReminderItemType, ReminderTiming } from '../types/notifications';
import { cn } from '../utils/cn';

export interface RemindMeButtonProps {
  /** Unique ID for the item */
  itemId: string | number;
  /** Display title for confirmation toast */
  itemTitle: string;
  /** ISO date string or null for TBA */
  releaseDate: string | null;
  /** Type of item (determines notification copy) */
  itemType: ReminderItemType;
  /** VAPID public key for push subscriptions */
  vapidPublicKey: string;
  /** Whether the feature is enabled */
  enabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

function formatReminderDate(releaseDate: string, timing: ReminderTiming): string {
  const date = new Date(releaseDate);
  if (timing === '1d') {
    date.setDate(date.getDate() - 1);
  } else if (timing === '1w') {
    date.setDate(date.getDate() - 7);
  }
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

export function RemindMeButton({
  itemId,
  itemTitle,
  releaseDate,
  itemType,
  vapidPublicKey,
  enabled = true,
  className,
}: RemindMeButtonProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const {
    permission,
    isSupported,
    hasReminder,
    setReminder,
    removeReminder,
    requestPermission,
  } = useNotifications({ vapidPublicKey, enabled });

  if (!enabled || !isSupported) return null;

  const isActive = hasReminder(itemId);
  const isTBA = !releaseDate;

  const handleTimingSelect = async (timing: ReminderTiming) => {
    setIsSubmitting(true);
    try {
      const success = await setReminder({
        itemId,
        itemTitle,
        itemType,
        releaseDate: releaseDate ?? 'TBA',
        timing,
      });

      if (success) {
        const dateText = isTBA
          ? 'when a release date is announced'
          : `on ${formatReminderDate(releaseDate, timing)}`;
        toast({
          title: `Reminder set for ${itemTitle} ${dateText}`,
          variant: 'success',
        });
      } else if (permission === 'denied') {
        toast({
          title: 'Notifications are blocked. Please enable them in your browser settings.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Could not set reminder. Please try again.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Could not set reminder. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      setOpen(false);
    }
  };

  const handleRemove = async () => {
    setIsSubmitting(true);
    try {
      const success = await removeReminder(itemId);
      if (success) {
        toast({
          title: `Reminder removed for ${itemTitle}`,
        });
      } else {
        toast({
          title: 'Could not remove reminder. Please try again.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Could not remove reminder. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      setOpen(false);
    }
  };

  const handleTriggerClick = async () => {
    // If permission not yet requested, prompt first
    if (permission === 'default') {
      const result = await requestPermission();
      if (result === 'denied') {
        toast({
          title: 'Notifications are blocked. Please enable them in your browser settings.',
          variant: 'destructive',
        });
        return;
      }
    }

    if (permission === 'denied') {
      toast({
        title: 'Notifications are blocked. Please enable them in your browser settings.',
        variant: 'destructive',
      });
      return;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={handleTriggerClick}
          className={cn(
            'inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors',
            isActive
              ? 'border-sky-500 bg-sky-500 text-white shadow-lg shadow-sky-500/30 hover:bg-sky-600'
              : 'border-zinc-200 bg-white text-zinc-600 hover:border-sky-500 hover:text-sky-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-sky-400 dark:hover:text-sky-400',
            className,
          )}
          aria-label={isActive ? `Remove reminder for ${itemTitle}` : `Set a release reminder for ${itemTitle}`}
        >
          {isActive ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-0">
        <div className="p-3">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {isActive ? 'Reminder set' : 'Remind me'}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {isTBA
              ? 'Get notified when a release date is announced'
              : 'Choose when to be notified'}
          </p>
        </div>

        <div className="border-t border-zinc-100 dark:border-zinc-800">
          {isActive ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleRemove}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <BellRing className="h-4 w-4" />
              )}
              Remove reminder
            </button>
          ) : isTBA ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => void handleTimingSelect('release')}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Bell className="h-4 w-4 text-zinc-400" />
              )}
              Notify me when date is announced
            </button>
          ) : (
            TIMING_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={isSubmitting}
                onClick={() => void handleTimingSelect(option.value)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Bell className="h-4 w-4 text-zinc-400" />
                )}
                {option.label}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
