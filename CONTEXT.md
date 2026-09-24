# ClipBeam

ClipBeam lets someone paste a Post link from X (Twitter), Instagram or Threads, preview its media, and download or share it.

## Language

**Platform**:
The social network a Post lives on — currently X, Instagram or Threads. Detected from the pasted link's host; the user never picks it.
_Avoid_: source, network, provider

**Post**:
A single public item on a Platform (an X tweet, an Instagram post or Reel, a Threads post) that ClipBeam resolves to exactly one image or video. Posts with several media items (carousels) are out of scope. Instagram Stories and Highlights are not Posts.
_Avoid_: tweet (except when talking about X specifically), thread, reel (as a separate concept — a Reel is just an Instagram Post whose media is a video)

**ResolvedMedia**:
The media extracted from a Post right after resolving the link, with its URLs exactly as the Platform's CDN gave them. Stays server-side only — some of those URLs will 403 (X video) or carry expiring signatures (Threads, Instagram) if a browser requests them directly.
_Avoid_: raw media, upstream media

**ParsedMedia**:
The media handed to the client once resolution is complete. Every URL on it is guaranteed either safe to reference directly or already run through the Media Proxy — the one shape a component ever needs to know about, whichever Platform the Post came from.
_Avoid_: ParsedXMedia, client media, resolved payload

**Media Proxy**:
A same-origin stand-in for a CDN URL the browser can't (or shouldn't) fetch directly, turning "fetch this externally-hosted file" into "fetch this from our own origin" so the CDN's cross-origin restrictions never reach the browser. Only fetches hosts on a Platform's allowlist.
_Avoid_: download endpoint, download proxy

**Beam**:
The owner-only relay that takes a Post link pasted on one device (usually a computer) and delivers it as a push notification to a paired phone. Tapping the notification opens the clip tool with the Post preloaded, so a single tap on Share opens the OS share sheet. A Beam carries only the link; the phone resolves the media itself.
_Avoid_: inbox, send-to-phone (as a noun), relay
