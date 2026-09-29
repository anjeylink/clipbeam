# ClipBeam

Next.js app. Uses pnpm.

## Develop

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

## Test

Run all four before calling a change done (there is no CI):

```bash
pnpm lint
pnpm typecheck    # runs `next typegen` first — don't use bare `tsc --noEmit`
pnpm test         # Vitest unit tests
pnpm test:e2e     # Playwright
```

## Build, run and publish a Docker image

Bump the tag (`v3` → `v4`, …) for each new release.

Build (`NEXT_PUBLIC_SITE_URL` is baked in at build time):

```bash
docker build --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_SITE_URL=https://clipbeam-test-fmcfdhb4hcczasa5.z02.azurefd.net \
  -t ghcr.io/anjeylink/clipbeam-nextjs-app:v3 .
```

Run locally:

```bash
docker run --rm -p 3000:3000 \
  -e NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=$(openssl rand -base64 32) \
  ghcr.io/anjeylink/clipbeam-nextjs-app:v3
```

Push to GitHub Container Registry (needs `docker login ghcr.io` first):

```bash
docker push ghcr.io/anjeylink/clipbeam-nextjs-app:v3
```

Beam needs extra env vars at runtime — see [AGENTS.md](AGENTS.md#beam).
