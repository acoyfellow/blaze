# Blaze
A simple realtime database for Cloudflare Workers.

![Blaze Diagram](https://github.com/acoyfellow/blaze/blob/main/public/diagram.jpg?raw=true)

---

## Quickstart (pragmatic, Better Auth-ready)

1. Install client in your frontend:

```bash
npm install @blaze-db/client
```

2. Deploy the Worker (this repo) to your Cloudflare account:

- Set auth config (choose one):
  - RS256 (Better Auth JWKS): set `BETTER_AUTH_JWKS_URL`, `BETTER_AUTH_ISSUER`, optional `BETTER_AUTH_AUDIENCE`
  - HS256 (shared secret): set `BETTER_AUTH_HMAC_SECRET`, optional `BETTER_AUTH_ISSUER`/`BETTER_AUTH_AUDIENCE`
- Optionally set `ALLOWED_ORIGINS` (comma-separated) for CORS

```bash
# set secrets/vars as needed
wrangler deploy
```

3. Use from the frontend:

```ts
import Blaze from '@blaze-db/client'

const blaze = new Blaze('https://<your-worker-domain>', {
  token: async () => getYourBetterAuthTokenSomehow(),
})

const doc = blaze.collection('todos').doc('abc')
const snap = await doc.get()
await doc.update({ done: true })

doc.onUpdate((s) => console.log('live', s.data()))
```

Notes:
- REST path: `/collections/:collection/docs/:id`
- WebSocket carries token via `?token=` automatically
- All requests require a valid Better Auth JWT

---

## Roadmap
- [x] POC backend + frontend lib (state)
- [x] Add example
- [x] Open source it
- [ ] Auth
- [ ] Explore other DO features (D1, KV, Storage, Queues)
- [ ] Add docs
- [ ] Make a hosted version
- [ ] Add tests

---

## Overview
Blaze is a **proof-of-concept (POC)** for a real-time, Firestore-like document store built on **Cloudflare Workers** and **Durable Objects**. It’s lightweight, scalable, and designed for experimentation.

---

## Why Blaze?
- **Firestore Alternative**: Firebase doesn’t work on Workers. Blaze fills the gap with Durable Objects.
- **Real-Time Updates**: WebSocket support for instant updates.
- **Scalability**: Built for high read/write workloads.
- **Fun Experiment**: A playground for exploring Cloudflare’s capabilities.

---

## Core Components
### `worker/server.ts`
- Worker + Durable Object logic, Better Auth-compatible JWT verification.

### `src/lib/blaze.ts` (client)
- Firestore-like API (`collection`, `doc`, `get`, `onUpdate`, `update`, `delete`).
- Real-time updates via WebSocket with automatic token and reconnect.

### `App.svelte`
- Demo UI.

---

## Current State
### What’s Working
- JWT-protected REST + WebSocket.
- CRUD operations.
- Client SDK with token support.

### What’s Not Working
- Server-side querying.
- No tests yet.

---

## Key Decisions
1. **Stable REST shape**: `/collections/:collection/docs/:id`.
2. **Better Auth compatibility** via JWKS or HMAC.
3. **Durable Objects as Documents**.

---

## Next Steps
- Queries and indexes (D1/KV).
- Backups (R2) and migrations.
- SDK packaging/publish.

---

*Note: This is still a **POC** evolving toward production.*