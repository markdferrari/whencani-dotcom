'use client';

import { Share2 } from 'lucide-react';
import { useToast } from './toast-provider';
import { cn } from '../utils/cn';

interface ShareButtonProps {
  title: string;
  text: string;
  url: string;
  className?: string;
}

export type { ShareButtonProps };

export function ShareButton({ title, text, url, className }: ShareButtonProps) {
  const { toast } = useToast();

  const isSecureContext = typeof window !== 'undefined' && window.isSecureContext;
  const canShare = isSecureContext && typeof navigator !== 'undefined' && 'share' in navigator;
  const canCopy = isSecureContext && typeof navigator !== 'undefined' && 'clipboard' in navigator;

  const handleShare = async () => {
    if (canShare) {
      try {
        await navigator.share({ title, text, url });
      } catch (err) {
        // User cancelled — do nothing
        if (err instanceof Error && err.name !== 'AbortError') {
          if (canCopy) {
            fallbackCopy();
          } else {
            toast({ title: 'Sharing requires a secure connection' });
          }
        }
      }
    } else if (canCopy) {
      fallbackCopy();
    } else {
      toast({ title: 'Sharing requires a secure connection' });
    }
  };

  const fallbackCopy = () => {
    navigator.clipboard.writeText(url);
    toast({ title: 'Link copied to clipboard' });
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      title="Share"
      aria-label="Share"
      className={cn(
        'inline-flex items-center justify-center rounded-full border px-2 py-2 text-xs font-semibold uppercase tracking-wide shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 border-zinc-200 bg-white/90 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:bg-zinc-800',
        className,
      )}
    >
      <Share2 className="h-4 w-4" />
    </button>
  );
}