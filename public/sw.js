// ClipBeam service worker: only here to receive Beam pushes (see
// docs/adr/0003-beam-single-secret-web-push.md). No caching, no offline.

self.addEventListener("push", (event) => {
  if (!event.data) return;
  const { title, body, url } = event.data.json();
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/apple-icon",
      data: { url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      const open = windows[0];
      if (open) {
        // WindowClient.navigate() isn't reliable in iOS's service worker, so
        // the page routes itself (BeamMessageListener).
        await open.focus();
        open.postMessage({ type: "beam", url });
        return;
      }
      await self.clients.openWindow(url);
    })(),
  );
});
