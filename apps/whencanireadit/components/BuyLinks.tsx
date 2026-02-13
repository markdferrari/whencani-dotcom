'use client';

import { ExternalLink } from 'lucide-react';
import { cn } from '@whencani/ui';
import type { BuyLink } from '@/lib/types';

interface BuyLinksProps {
  links: BuyLink[];
  isPreorder?: boolean;
  className?: string;
}

export function BuyLinks({ links, isPreorder = false, className }: BuyLinksProps) {
  if (links.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {isPreorder && (
        <span className="flex items-center rounded-full bg-sky-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
          Pre-order
        </span>
      )}
      {links.map((link) => (
        <a
          key={link.name}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200/70 bg-white/80 px-4 py-1.5 text-sm font-medium text-zinc-700 transition hover:border-sky-500 hover:text-sky-600 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:border-sky-400 dark:hover:text-sky-400"
        >
          {link.name}
          <ExternalLink className="h-3 w-3" />
        </a>
      ))}
    </div>
  );
}
