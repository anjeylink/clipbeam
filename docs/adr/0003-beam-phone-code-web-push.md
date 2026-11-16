# Beam connects a computer to a phone with a code the phone shows, and delivers links by Web Push

Beam is open to everyone and has no accounts. A phone becomes a receiver by turning on notifications at `/beam`. The server stores its push subscription under a random phone id and gives the phone an httpOnly `beam_phone` cookie holding that id. The phone then shows a 6-digit code. Typing that code on a computer connects the two: the computer gets a `beam_computer` cookie holding the same phone id, and every link it sends goes to that phone. A computer has at most one phone. A phone can be connected to any number of computers, one code each.

The code is shown on the phone and typed on the computer, not the other way round. A code only exists once the phone can receive, so the first link sent always lands. Typing is easier on a keyboard, and the computer learns it's connected from its own request instead of polling. The moment a computer connects, the server pushes a "Connected" notification to the phone, which proves the whole chain works before anything real is sent.

Both cookies are signed with `BEAM_SECRET`, a server-only key nobody types. The role is part of the signed input, so a computer's cookie can't be replayed as the phone's. Because the computer's cookie carries the phone id itself, rendering `/beam` needs no store lookup, and Disconnect only clears that cookie. Rotating `BEAM_SECRET` disconnects every device.

The store is Upstash Redis (Vercel Marketplace). `beam:phone:<id>` holds the subscription and locale, and expires after a year without use. `beam:code:<code>` points at a phone id for 10 minutes and is deleted when used (`GETDEL`), so each code works once. Six digits stay safe only while guessing is slow: connect attempts are limited per IP before a code is consumed, and new phones, codes and sends have their own limits. A correct guess connects the guesser's computer to a stranger's phone, and they could only send it post links, since `/api/beam/send` accepts nothing else. When the push service reports a subscription gone (404/410), the phone record is deleted, and the next send from a computer clears that computer's cookie so it asks for a code again. The client is created lazily so the site still builds and renders without the env vars.

The phone is reached by Web Push, not a page that has to stay open, because the whole point is "paste on the computer, the phone reacts". On iOS that only works for a Home Screen app (16.4+). That app has its own cookies and no address bar, and it opens at `/`, so the footer links to Beam on every page and `/beam` walks iPhone Safari users through adding ClipBeam to the Home Screen. Which half of Beam to show is guessed from the user agent, with a link to switch when the guess is wrong.

The browser won't open a share sheet without a tap on the phone (`navigator.share` needs user activation), so a push can't share on its own. The notification opens `/?url=<post>` instead, and the existing clip tool preloads the media behind its Share button. The push payload carries only the link; media isn't resolved when the link is sent, because Threads URLs are signed and expire.

Rejected alternatives:
- A single owner secret typed on each device: it limited Beam to one person. It was the first version of this ADR.
- A QR code: iPhone's camera opens a scanned link in Safari, not in the Home Screen app that receives pushes, and a computer can't scan a phone's screen.
- Pairing in both directions, or groups of devices: one phone per computer covers sending from several computers to one phone with a single rule.
- A realtime page on the phone: it only works while the page is open.
- Real accounts: a code is enough to link two devices someone holds at the same time.
