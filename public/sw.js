/* Service worker: network-first для страницы (свежие версии),
   офлайн-фолбэк из кэша. Приложение однофайловое — кэшировать почти нечего. */
const CACHE = 'bag-v2'

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(['./', './manifest.webmanifest', './icon.svg']))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  if (req.mode === 'navigate' || req.destination === 'document') {
    e.respondWith(
      // no-cache: ревалидация у сервера, а не 10-минутный HTTP-кэш GitHub Pages —
      // иначе после деплоя «иногда» рендерится старый бандл (старые размеры фигур)
      fetch(req, { cache: 'no-cache' })
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put('./', copy))
          return res
        })
        .catch(() => caches.match('./'))
    )
    return
  }
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok && new URL(req.url).origin === location.origin) {
        const copy = res.clone()
        caches.open(CACHE).then((c) => c.put(req, copy))
      }
      return res
    }))
  )
})
