---
name: Sprint 1 Architecture Decisions
description: Key non-obvious decisions made during Sprint 1 implementation
type: project
---

Dashboard lives at `app/page.tsx` (not inside the `(dashboard)` route group) to avoid the Next.js conflict between `app/page.tsx` and `app/(dashboard)/page.tsx` both resolving to `/`. The `(dashboard)` group layout only applies to sub-routes (rooms/[id], etc.).

**Why:** Next.js App Router throws a build error when two page.tsx files resolve to the same URL path.

**How to apply:** If adding new top-level routes, put them inside `app/(dashboard)/` to get BottomNav from the group layout. The root `/` always lives at `app/page.tsx` with BottomNav imported directly.

`app/(dashboard)/page.tsx` is a dead-end redirect stub — can be deleted safely.

API auth uses `ESP32_API_KEY` env var as `X-API-Key` header — same key used for browser uploads via `NEXT_PUBLIC_API_KEY`. Both must match in `.env.local`.

Claude Vision uses `claude-haiku-4-5` model via `@anthropic-ai/sdk`. Both URL-based (`analyseRoomUrl`) and base64-based (`analyseRoomBase64`) helpers exist in `lib/claude-vision.ts`.

OCI Object Storage uses AWS S3-compatible SDK with `forcePathStyle: true`.

Oracle DB uses `oracledb` in thin mode (no native client needed), wallet-based mTLS. Files go in `./wallet/` directory.
