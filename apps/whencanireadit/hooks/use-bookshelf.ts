'use client';

import { useCallback, useEffect, useState } from 'react';
import { BOOKSHELF_COOKIE_NAME, parseBookshelfCookie } from '@/lib/bookshelf';
import { useToast } from '@whencani/ui';

const BOOKSHELF_EVENT_NAME = 'bookshelf:update';

function readCookieValue(name: string) {
  if (typeof document === 'undefined') {
    return null;
  }

  return document.cookie
    .split(';')
    .map((fragment) => fragment.trim())
    .find((fragment) => fragment.startsWith(`${name}=`))
    ?.split('=')
    .slice(1)
    .join('=') ?? null;
}

function readLocalBookshelf() {
  const cookieValue = readCookieValue(BOOKSHELF_COOKIE_NAME);
  return parseBookshelfCookie(cookieValue);
}

export function broadcastBookshelfUpdate(ids: string[]) {
  if (typeof window === 'undefined') return;
  const event = new CustomEvent<string[]>(BOOKSHELF_EVENT_NAME, { detail: ids });
  window.dispatchEvent(event);
}

export function useBookshelfIds() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(readLocalBookshelf());

    const handler = (event: Event) => {
      if (event instanceof CustomEvent) {
        setIds(event.detail ?? []);
      }
    };

    window.addEventListener(BOOKSHELF_EVENT_NAME, handler as EventListener);
    return () => window.removeEventListener(BOOKSHELF_EVENT_NAME, handler as EventListener);
  }, []);

  return ids;
}

export type BookshelfAction = 'add' | 'remove';

interface BookshelfMutationPayload {
  ids: string[];
  message?: string;
  variant?: 'success' | 'destructive' | 'default';
}

export function useBookshelfActions() {
  const { toast } = useToast();

  return useCallback(async (bookId: string, action: BookshelfAction) => {
    const response = await fetch('/api/bookshelf', {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, bookId }),
    });

    const payload: BookshelfMutationPayload = await response.json().catch(() => ({ ids: [] }));

    if (!response.ok) {
      const message = payload?.message ?? 'Unable to update bookshelf';
      toast({ title: message, variant: 'destructive' });
      throw new Error(message);
    }

    broadcastBookshelfUpdate(payload.ids);

    if (payload.message) {
      toast({ title: payload.message, variant: payload.variant ?? 'success' });
    }

    return payload.ids;
  }, [toast]);
}
