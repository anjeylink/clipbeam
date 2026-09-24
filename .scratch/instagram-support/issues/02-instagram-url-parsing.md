# 02-instagram-url-parsing

Status: resolved

Spec: ../spec.md

Add "instagram" to Platform; validate /p, /reel(s), /tv links (with optional username segment, instagr.am, m./www.) and /share/ links in parse-post-url.ts. A share link must never be read as a /<user>/reel/<code> link.
