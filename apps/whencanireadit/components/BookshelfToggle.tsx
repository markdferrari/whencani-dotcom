'use client';

import { Star } from 'lucide-react';
import { useCallback, useState, type MouseEvent } from 'react';
import { cn } from '@whencani/ui';
import { useBookshelfActions, useBookshelfIds } from '@/hooks/use-bookshelf';

interface BookshelfToggleProps {
  bookId: string;
  className?: string;
}

export function BookshelfToggle({ bookId, className }: BookshelfToggleProps) {
  const ids = useBookshelfIds();
  const mutate = useBookshelfActions();
  const [isPending, setIsPending] = useState(false);

  const isFavourite = ids.includes(bookId);
  const action = isFavourite ? 'remove' : 'add';
  const title = isFavourite ? 'Remove from bookshelf' : 'Add to bookshelf';

  const handleClick = useCallback(
    async (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      if (isPending) return;
      setIsPending(true);

      try {
        await mutate(bookId, action);
      } finally {
        setIsPending(false);
      }
    },
    [action, bookId, isPending, mutate],
  );

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={isFavourite}
      title={title}
      aria-label={title}
      aria-busy={isPending}
      className={cn(
        'inline-flex items-center justify-center rounded-full border px-2 py-2 text-xs font-semibold uppercase tracking-wide shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500',
        isFavourite
          ? 'border-amber-300 bg-amber-50 text-amber-600 hover:bg-amber-100 focus-visible:outline-amber-400'
          : 'border-zinc-200 bg-white/90 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:bg-zinc-800',
        isPending && 'cursor-wait opacity-70',
        className,
      )}
    >
      <Star className="h-4 w-4" fill={isFavourite ? 'currentColor' : 'none'} />
    </button>
  );
}
