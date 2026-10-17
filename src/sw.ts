import { createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<string | { url: string; revision?: string | null }>;
};

precacheAndRoute(self.__WB_MANIFEST);

// Offline navigations (any path or query, e.g. /?e2e or a deep link) get the cached app shell.
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html'), { denylist: [/^\/packs\//] }));

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const route = event.notification.data?.route === '#train' ? '#train' : event.notification.data?.route === '#night' ? '#night' : '#plan';
  event.waitUntil(self.clients.openWindow(`/${route}`));
});
