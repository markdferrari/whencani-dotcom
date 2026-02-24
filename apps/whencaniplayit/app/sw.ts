import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }: { request: Request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();

// Push notification handler
interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;

  try {
    const data = event.data.json() as PushPayload;

    const options: NotificationOptions = {
      body: data.body,
      icon: data.icon ?? '/icon-192x192.png',
      badge: data.badge ?? '/icon-192x192.png',
      tag: data.tag ?? 'release-reminder',
      data: { url: data.url ?? '/' },
      requireInteraction: true,
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  } catch {
    // Invalid push payload — ignore
  }
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  const url = (event.notification.data as { url?: string })?.url ?? '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus an existing tab if open
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return (client as WindowClient).focus();
        }
      }
      // Otherwise open a new tab
      return self.clients.openWindow(url);
    }),
  );
});
