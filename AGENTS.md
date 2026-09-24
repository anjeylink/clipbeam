<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Testing

Prefer e2e tests (Playwright, `e2e/*.spec.ts`) over unit tests. Write a unit test (Vitest, colocated `*.test.ts`) only for pure logic under `src/lib/` — everything touching a component, route handler, or user flow goes in `e2e/`. Follow `e2e/clip-tool.spec.ts` for the house style: role/label locators (not test-ids), `page.route()` for mocking network calls.

## Internationalization

All user-facing text is translatable via Intlayer — never hardcode a string. Declare it in a colocated `*.content.ts` (or `metadata.content.ts` for page metadata) using `t({ en: "...", uk: "..." })`, and consume it with `useIntlayer("<key>")`. Both `en` and `uk` are required for every entry — a missing Ukrainian translation is a blocker, not something to stub with English. Brand/product names (e.g. `ClipBeam`) are exempt.

## Verification

No CI and no pre-commit hooks exist in this repo — nothing checks your work automatically. Before calling a change done, run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm test:e2e` yourself. Always run `pnpm typecheck`, not bare `tsc --noEmit` — the script runs `next typegen` first to regenerate the route types the check depends on.

## Media URLs

`toClientMedia` (`src/lib/server/to-client-media.ts`) is the only place that turns raw upstream CDN URLs into what the client receives — it enforces the same host allowlist `/api/download` uses (checked against the post's own Platform), so a URL that would 403 later is rejected here first. Route new media through it rather than handing upstream URLs to the client directly. The one deliberate exception: an X image's `previewUrl` and video `posterUrl` stay raw (pbs.twimg.com allows hotlinking); everything else — `proxiedUrl`, all video qualities, and every Instagram and Threads URL (signed, expiring) — is proxied.

The allowlist in `src/lib/server/media-proxy.ts` is per-Platform: exact hosts for X, dot-anchored suffixes (`.fbcdn.net`, `.cdninstagram.com`) for Instagram and Threads, and `/api/download` re-checks every redirect hop against it (see `docs/adr/0002-per-platform-suffix-allowlist.md`). Never widen it to a substring match.

## Beam

Beam (`/beam`, `/api/beam/*`, `public/sw.js`) is the owner-only relay from desktop to phone described in `docs/adr/0003-beam-single-secret-web-push.md`. It needs these env vars, and it is inert without them. The public site doesn't need them.
- `BEAM_SECRET`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (`mailto:`). Generate the keys with `pnpm dlx web-push generate-vapid-keys`.
- The Upstash Redis REST URL and token: `UPSTASH_REDIS_REST_*` or `KV_REST_API_*`.

The e2e suite gets a fixed `BEAM_SECRET` through `webServer.env` in `playwright.config.ts`. If you reuse a dev server that's already running, start it with the same value, or the paired Beam tests fail.

## TypeScript version

TypeScript is pinned to `^6.0.3`, past this model's training cutoff — don't assume TS 5-era syntax or compiler options are still current. Check `tsconfig.json` and the installed `typescript` version before relying on anything you're not certain still applies.

## Grilling

When running a grilling session (interviewing the user round-by-round to build a design tree), ask each round's questions with the native `AskUserQuestion` tool instead of plain chat text — never number questions in a text block when this tool is available. Split a round into multiple `AskUserQuestion` calls if it has more than 4 questions, since that tool caps at 4 per call.

Every question needs a recommended answer, per the grilling skill — and the tool doesn't surface that on its own. Make the recommended option the first one listed and append `(Recommended)` to its label; otherwise the user has no way to see which option you'd pick.
