
const CACHE_NAME = "bounce-pwa-v1";

self.addEventListener("install", event => {
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener("push", event => {

    let notificationData = {};

    if (event.data) {
        try {
            notificationData = event.data.json();
        } catch {
            notificationData = {
                body: event.data.text()
            };
        }
    }

    const title = notificationData.title || "New BOUNCE Order";

    const options = {
        body: notificationData.body || "You have received a new order.",
        icon: "/images/bounce-logo.jpeg",
        badge: "/images/bounce-logo.jpeg",
        tag: notificationData.tag || "bounce-new-order",
        renotify: true,
        data: {
            url: "/admin.html#orders"
        },
        requireInteraction: true
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener("notificationclick", event => {

    event.notification.close();

    const targetUrl = new URL(
        event.notification.data?.url || "/admin.html#orders",
        self.location.origin
    ).href;

    event.waitUntil(

        self.clients.matchAll({
            type: "window",
            includeUncontrolled: true
        }).then(async clients => {

            for (const client of clients) {

                if (new URL(client.url).origin !== self.location.origin) {
                    continue;
                }

                if ("navigate" in client) {
                    await client.navigate(targetUrl);
                }

                await client.focus();
                return;
            }

            if (self.clients.openWindow) {
                await self.clients.openWindow(targetUrl);
            }
        })
    );
});
