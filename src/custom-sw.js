/**
 * MediTigo — Custom Service Worker
 *
 * Extiende el ngsw-worker de Angular para manejar eventos push y clicks
 * en notificaciones. La lógica de caché PWA se delega a ngsw-worker.
 *
 * Payload esperado del backend (JSON):
 * {
 *   title:       string
 *   body:        string
 *   url?:        string   — ruta a abrir al hacer click en el cuerpo
 *   calendarUrl?: string  — URL firmada del .ics (acción "Agregar al calendario")
 *   tag?:        string   — colapsa notificaciones del mismo tipo
 *   icon?:       string
 * }
 */

// Delegar todo el manejo de caché/actualizaciones al service worker de Angular
importScripts('/ngsw-worker.js');

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: 'MediTigo', body: event.data.text() };
  }

  const title = data.title || 'MediTigo';
  const options = {
    body: data.body || '',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: data.tag || 'meditigo-notification',
    data: data,
    requireInteraction: false,
    actions: buildActions(data),
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};

  if (event.action === 'add_calendar' && data.calendarUrl) {
    // Abrir la URL del ICS directamente — el browser descarga el archivo
    // y el OS pregunta con qué app de calendario abrirlo.
    event.waitUntil(clients.openWindow(data.calendarUrl));
    return;
  }

  // Click en el cuerpo de la notificación o en la acción "ver"
  const targetUrl = data.url || '/patient/appointments';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Si ya hay una ventana de la app abierta, enfocarla y navegar
        for (const client of clientList) {
          if ('navigate' in client) {
            return client.focus().then((c) => c.navigate(targetUrl));
          }
        }
        // Si no hay ventana abierta, abrir una nueva
        return clients.openWindow(targetUrl);
      })
  );
});

/** Construye las acciones del notification según el payload recibido. */
function buildActions(data) {
  const actions = [];

  if (data.url) {
    actions.push({ action: 'view', title: 'Ver cita' });
  }

  if (data.calendarUrl) {
    actions.push({ action: 'add_calendar', title: 'Agregar al calendario' });
  }

  return actions;
}
