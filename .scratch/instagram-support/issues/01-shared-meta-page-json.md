# 01-shared-meta-page-json

Status: resolved

Spec: ../spec.md

Pull the Platform-generic parts of map-threads-page.ts (data-sjs JSON search, largest-image pick, media mapping with a `platform` argument) and the HTML entity decoder into shared modules, so Instagram's page fallback can reuse them. Threads tests must pass unchanged before any Instagram code lands.
