'use client';

import { RemindMeButton as BaseRemindMeButton } from '@whencani/ui';
import type { ReminderItemType } from '@whencani/ui';
import { config } from '@/lib/config';

interface BookRemindMeButtonProps {
  itemId: string;
  itemTitle: string;
  releaseDate: string | null;
  className?: string;
}

export function BookRemindMeButton({ itemId, itemTitle, releaseDate, className }: BookRemindMeButtonProps) {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';
  const itemType: ReminderItemType = 'book';

  return (
    <BaseRemindMeButton
      itemId={itemId}
      itemTitle={itemTitle}
      releaseDate={releaseDate}
      itemType={itemType}
      vapidPublicKey={vapidPublicKey}
      enabled={config.features.notifications}
      className={className}
    />
  );
}
