/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim, skipWaiting } from 'workbox-core';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare let self: ServiceWorkerGlobalScope;

// IMPORTANTE: Forçar atualização imediata do SW
skipWaiting();
clientsClaim();

// Listener para mensagem de atualização manual (backup)
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Limpar caches antigos
cleanupOutdatedCaches();

// Precache dos assets gerados pelo build
precacheAndRoute(self.__WB_MANIFEST);

// CRÍTICO: Navegação (páginas HTML) sempre busca da rede primeiro
// Isso garante que Landing e Auth sempre mostrem a versão mais recente
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'pages-cache-v2',
    networkTimeoutSeconds: 3, // Se rede demorar mais de 3s, usa cache
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 60 * 60 * 24, // 24 horas
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Cache para JS/CSS - StaleWhileRevalidate (mostra cache, atualiza em background)
registerRoute(
  ({ request }) => 
    request.destination === 'script' || 
    request.destination === 'style',
  new StaleWhileRevalidate({
    cacheName: 'static-resources-v2',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 60 * 60 * 24 * 7, // 7 dias
      }),
    ],
  })
);

// Cache para requisições do Supabase
registerRoute(
  ({ url }) => url.hostname.includes('supabase.co'),
  new NetworkFirst({
    cacheName: 'supabase-cache-v2',
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24, // 24 horas
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Cache para imagens - CacheFirst (performance)
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache-v2',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 dias
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Cache para fontes
registerRoute(
  ({ request }) => request.destination === 'font',
  new CacheFirst({
    cacheName: 'fonts-cache-v2',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 ano
      }),
    ],
  })
);
