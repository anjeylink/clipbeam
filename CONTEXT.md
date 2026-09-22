# ClipBeam

ClipBeam lets someone paste an X (Twitter) post link, preview its media, and download or share it.

## Language

**ResolvedMedia**:
The media extracted from an X post right after resolving the link, with its URLs exactly as the upstream CDN gave them. Stays server-side only — one of those URLs (video) will 403 if a browser requests it directly.
_Avoid_: raw media, upstream media

**ParsedXMedia**:
The media handed to the client once resolution is complete. Every URL on it is guaranteed either safe to reference directly or already run through the Media Proxy — the one shape a component ever needs to know about.
_Avoid_: client media, resolved payload

**Media Proxy**:
A same-origin stand-in for a CDN URL the browser can't fetch directly, turning "fetch this externally-hosted file" into "fetch this from our own origin" so the CDN's cross-origin restrictions never reach the browser.
_Avoid_: download endpoint, download proxy
