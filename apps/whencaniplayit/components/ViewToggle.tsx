'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

const VIEWS = [
  { id: 'upcoming', name: 'Coming Soon' },
  { id: 'recent', name: 'Recently Released' },
];

export function ViewToggle() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view') || 'upcoming';
  const [isPending, startTransition] = useTransition();

  const handleViewChange = (viewId: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      params.set('view', viewId);
      router.push(`/?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div className="inline-flex rounded-full border border-zinc-200/70 bg-white/80 p-1 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-900/80">
      {VIEWS.map((view) => (
        <button
          key={view.id}
          onClick={() => handleViewChange(view.id)}
          disabled={isPending}
          className={`rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wide transition ${
            currentView === view.id
              ? 'bg-sky-500 text-white shadow shadow-sky-500/40'
              : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
          } ${isPending ? 'cursor-wait opacity-50' : ''}`}
        >
          {view.name}
        </button>
      ))}
    </div>
  );
}
