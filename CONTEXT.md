# ClipBeam

ClipBeam lets someone paste a Post link from X (Twitter) or Threads, preview its media, and download or share it.

## Language

**Platform**:
The social network a Post lives on — currently X or Threads. Detected from the pasted link's host; the user never picks it.
_Avoid_: source, network, provider

**Post**:
A single public item on a Platform (an X tweet, a Threads post) that ClipBeam resolves to exactly one image or video. Posts with several media items are out of scope.
_Avoid_: tweet (except when talking about X specifically), thread

**ResolvedMedia**:
The media extracted from a Post right after resolving the link, with its URLs exactly as the Platform's CDN gave them. Stays server-side only — some of those URLs will 403 (X video) or carry expiring signatures (Threads) if a browser requests them directly.
_Avoid_: raw media, upstream media

**ParsedMedia**:
The media handed to the client once resolution is complete. Every URL on it is guaranteed either safe to reference directly or already run through the Media Proxy — the one shape a component ever needs to know about, whichever Platform the Post came from.
_Avoid_: ParsedXMedia, client media, resolved payload

**Media Proxy**:
A same-origin stand-in for a CDN URL the browser can't (or shouldn't) fetch directly, turning "fetch this externally-hosted file" into "fetch this from our own origin" so the CDN's cross-origin restrictions never reach the browser. Only fetches hosts on a Platform's allowlist.
_Avoid_: download endpoint, download proxy
