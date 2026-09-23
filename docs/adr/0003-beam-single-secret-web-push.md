# Beam pairs devices with one shared secret and delivers links by Web Push

Beam exists for one person (the owner), so it doesn't need accounts. `BEAM_SECRET` is the only credential. A device pairs by entering it once at `/beam`. The server then sets an httpOnly `beam_session` cookie holding an HMAC of a fixed label keyed by that secret, never the secret itself, and every Beam route checks that cookie. Rotating the secret unpairs every device.

The phone is reached by Web Push, not a page that has to stay open, because the whole point is "paste on the computer, the phone reacts". On iOS that only works for a Home Screen app (16.4+). That app has its own cookies and no address bar, so the only way into `/beam` there is a footer link rendered only under `display-mode: standalone`.

The browser won't open a share sheet without a tap on the phone (`navigator.share` needs user activation), so a push can't share on its own. The notification opens `/?url=<post>` instead, and the existing clip tool preloads the media behind its Share button. The push payload carries only the link; media isn't resolved when the link is sent, because Threads URLs are signed and expire.

Push subscriptions live in Upstash Redis (Vercel Marketplace), in one hash keyed by endpoint. The client is created lazily so the site still builds and renders without the env vars. A subscription the push service reports as gone (404/410) is deleted when the next send fails.

Rejected alternatives:
- A realtime page on the phone: it only works while the page is open.
- A QR code: it isn't automatic.
- Real accounts: nobody but the owner uses Beam.
