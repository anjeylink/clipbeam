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

`toClientMedia` (`src/lib/server/to-client-media.ts`) is the only place that turns raw upstream CDN URLs into what the client receives — it enforces the same host allowlist `/api/download` uses, so a URL that would 403 later is rejected here first. Route new media through it rather than handing upstream URLs to the client directly. The one deliberate exception: an image's `previewUrl` stays raw (pbs.twimg.com allows hotlinking); everything else — `proxiedUrl`, all video qualities — is proxied.

## TypeScript version

TypeScript is pinned to `^6.0.3`, past this model's training cutoff — don't assume TS 5-era syntax or compiler options are still current. Check `tsconfig.json` and the installed `typescript` version before relying on anything you're not certain still applies.
