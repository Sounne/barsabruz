const CACHE_NAME = 'barsabruz-shell-v1'
const SHELL_URLS = [
  './',
  './manifest.webmanifest',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {})
        return response
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./'))),
  )
})

self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = { title: 'Bars a Bruz', body: event.data?.text() || 'Nouvelle notification' }
  }

  const title = payload.title || 'Bars a Bruz'
  const options = {
    body: payload.body || 'Il y a du nouveau autour de Bruz.',
    icon: payload.icon || './icon-192.png',
    badge: payload.badge || './icon-192.png',
    tag: payload.tag || 'barsabruz',
    data: {
      url: payload.url || './',
      ...payload.data,
    },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = new URL(event.notification.data?.url || './', self.registration.scope).href

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => client.url.startsWith(self.registration.scope))
      if (existing) {
        existing.focus()
        existing.navigate(targetUrl)
        return
      }
      return self.clients.openWindow(targetUrl)
    }),
  )
})
