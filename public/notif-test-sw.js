// notif-test-sw.js — service worker minimal pour le test de notifications
// (fichier de diagnostic, sans rapport avec la logique de l'app)

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// Réception d'un push réel (utile pour l'étape suivante si le test réussit)
self.addEventListener('push', (event) => {
  let data = { title: 'WorkπServ', body: 'Notification push reçue 🎉' };
  try { if (event.data) data = event.data.json(); } catch (e) { /* payload texte */ }
  event.waitUntil(
    self.registration.showNotification(data.title || 'WorkπServ', {
      body: data.body || '',
      badge: '/favicon.ico',
    })
  );
});

// Clic sur la notification → ouvre l'app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow('/'));
});
