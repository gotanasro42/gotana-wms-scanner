/* Gotana – service worker: appka sa otvára ako aplikácia a štartuje z pamäte telefónu.
   Živé dáta (Supabase) idú vždy priamo z internetu, nikdy z pamäte. */
const VERZIA = 'gotana-v1';
const JADRO = ['/', '/index.html', '/statistiky.html', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(VERZIA).then(c => c.addAll(JADRO)).catch(() => {}));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(k => Promise.all(k.filter(x => x !== VERZIA).map(x => caches.delete(x))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.hostname.endsWith('supabase.co') || u.hostname.endsWith('huggingface.co')) return;

  const vlastna = u.origin === self.location.origin;
  const stranka = r.mode === 'navigate' || (vlastna && (/\.(html|json)$/.test(u.pathname) || u.pathname.endsWith('/')));

  if (stranka) {
    /* stránky a dáta: najprv internet (vždy najnovšia verzia), pri výpadku siete z pamäte */
    e.respondWith(
      fetch(r).then(res => {
        if (res.ok) { const k = res.clone(); caches.open(VERZIA).then(c => c.put(r, k)); }
        return res;
      }).catch(() => caches.match(r).then(m => m || (r.mode === 'navigate' ? caches.match('/index.html') : Response.error())))
    );
    return;
  }

  const kniznica = /(^|\.)(cdn\.tailwindcss\.com|cdnjs\.cloudflare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net)$/.test(u.hostname);
  if (kniznica || vlastna) {
    /* knižnice, písma, ikonky: okamžite z pamäte, na pozadí sa aktualizujú */
    e.respondWith(caches.open(VERZIA).then(c => c.match(r).then(m => {
      const siet = fetch(r).then(res => {
        if (res.ok || res.type === 'opaque') c.put(r, res.clone());
        return res;
      }).catch(() => m || Response.error());
      if (m) { e.waitUntil(siet.catch(() => {})); return m; }
      return siet;
    })));
  }
});
