# Blaze
A simple realtime database for Cloudflare Workers.

![Blaze Diagram](https://github.com/acoyfellow/blaze/blob/main/public/diagram.jpg?raw=true)

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
### `server.ts`
- **Purpose**: Backend logic for Workers and Durable Objects.
- **Features**:
  - Manages JSON document state.
  - Handles WebSocket connections.
  - Exposes HTTP endpoints for CRUD operations.

### `blaze.ts`
- **Purpose**: Client-side library.
- **Features**:
  - Firestore-like API (`collection`, `doc`, `get`, `onUpdate`, `update`).
  - Real-time updates via WebSocket.
  - Basic client-side querying (`.where()`).

### `App.svelte`
- **Purpose**: Demo UI.
- **Features**:
  - Real-time document updates.
  - Clean, modern UI with Tailwind CSS.

---

## Current State
### What’s Working
- Real-time updates via WebSocket.
- CRUD operations (HTTP + WebSocket).
- Firestore-like client API.
- Demo UI.

### What’s Not Working
- Querying is client-side (not scalable).
- No authentication.
- Basic error handling.

---

## Key Decisions
1. **Firestore-like API**: Familiar and easy to use.
2. **WebSocket for Real-Time Updates**: Instant updates for connected clients.
3. **Durable Objects as Documents**: Scalable state management.
4. **Tailwind CSS**: Clean, modern UI.

---

## Next Steps
### Short-Term
- **Querying**: Add server-side filtering/indexing.
- **Auth**: Integrate API keys or OAuth.
- **Error Handling**: Improve robustness and logging.
- **Testing**: Simulate high traffic for optimization.

### Long-Term
- **Advanced Querying**: Use D1 or KV for server-side queries.
- **Persistence**: Backup state with R2 or D1.
- **Nested Documents**: Support nested data structures.
- **Transactions**: Add batch updates or transactions.
- **Hosted Version**: Offer a managed, hosted solution.
- **Documentation**: Write comprehensive docs for open-source adoption.

---

## Code Structure
### Backend
- `server.ts`: Worker + Durable Object logic.
- `blaze.ts`: Client-side library.

### Frontend
- `App.svelte`: Demo UI.

---

## Why Blaze?
Blaze is a **minimal, scalable, and real-time document store** for Cloudflare Workers. It’s perfect for developers who need Firestore-like functionality without the overhead of Firebase.

---

*Note: This is a **proof-of-concept (POC)**. It’s not production-ready, but it’s a great starting point for experimentation.*