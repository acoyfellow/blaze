# blaze
A simple realtime database for Cloudflare Workers.

Roadmap:
  > POC backend + frontend lib (State, Auth, Storage, D1)
  > Add docs
  > Add examples
  > Open souce it
  > * Make a hosted version * 
  > Add tests

# Overview

## What We're Building
We're building a real-time, Firestore-like document store using Cloudflare Durable Objects and Partykit. The goal is to create a lightweight, scalable, and real-time system for managing JSON documents with WebSocket-powered updates.

## Why We're Building It
- **Firestore Alternative:**  
  Cloudflare doesn’t offer Firestore, but Durable Objects can act as a document store with additional capabilities (e.g., WebSockets, custom logic).

- **Real-Time Updates:**  
  We want to support real-time updates for connected clients, similar to Firestore’s `onSnapshot` functionality.

- **Scalability:**  
  Durable Objects are designed to handle high read/write workloads, making them a good fit for this use case.

- **Fun Experiment:**  
  This is an exploration of Cloudflare’s capabilities and a chance to build something unique.

# Core Components

## 1. `server.ts`
**Purpose:**  
The backend logic running on Cloudflare Workers and Durable Objects.

**Features:**
- Manages document state as JSON blobs.
- Handles WebSocket connections for real-time updates.
- Exposes HTTP endpoints for CRUD operations.

**Key Improvements:**
- Simplified WebSocket and HTTP routing.
- Better error handling and logging.
- Production-ready structure.

## 2. `blaze.ts`
**Purpose:**  
The client-side library for interacting with the backend.

**Features:**
- Firestore-like API (`collection`, `doc`, `get`, `onUpdate`, `update`).
- Real-time updates via WebSocket.
- Basic querying with `.where()` (client-side filtering).

**Key Improvements:**
- Clean, intuitive API.
- Robust error handling.
- Lightweight and easy to integrate.

## 3. `App.svelte`
**Purpose:**  
The frontend UI to demonstrate the system’s capabilities.

**Features:**
- Displays document data in real-time.
- Allows updating the document via a form.
- Uses Tailwind CSS for a clean, modern UI.

**Key Improvements:**
- Pragmatic demo of real-time updates.
- Clear and user-friendly interface.

# Current State

## What’s Working
- **Real-Time Updates:**  
  WebSocket connections are working, and clients receive updates in real-time.

- **CRUD Operations:**  
  Documents can be created, read, updated, and deleted via HTTP and WebSocket.

- **Client-Side Library:**  
  The `blaze.ts` library provides a Firestore-like API for interacting with the backend.

- **Frontend Demo:**  
  The `App.svelte` file demonstrates the system’s functionality with a clean UI.

## What’s Not Working
- **Querying:**  
  The `.where()` method currently filters client-side, which won’t scale well for large datasets.

- **Authentication:**  
  No authentication or authorization is implemented yet.

- **Error Handling:**  
  While basic error handling is in place, more robust solutions are needed for production.

# Key Decisions

1. **Firestore-like API**  
   We decided to mimic Firestore’s API (`collection`, `doc`, `get`, `onUpdate`, `update`) to make the system familiar and easy to use.

2. **WebSocket for Real-Time Updates**  
   WebSocket connections are used for real-time updates, similar to Firestore’s `onSnapshot`.

3. **Durable Objects as Documents**  
   Each Durable Object acts as a document, storing its state as a JSON blob. This allows for high read/write workloads and real-time updates.

4. **Tailwind CSS for UI**  
   Tailwind CSS is used for styling the frontend, ensuring a clean and modern UI.

# Next Steps

## Short-Term
- **Improve Querying:**
  - Implement server-side filtering or indexing for better performance.
  - Explore using Durable Object storage for metadata or tags.

- **Add Authentication:**
  - Secure the backend with API keys or OAuth.
  - Add role-based access control (RBAC) for documents.

- **Enhance Error Handling:**
  - Add more robust error handling for WebSocket and HTTP requests.
  - Log errors to a monitoring system (e.g., Cloudflare Logs).

- **Test at Scale:**
  - Simulate high traffic to identify bottlenecks.
  - Optimize Durable Object usage to handle more connections.

## Long-Term
- **Extend Functionality:**
  - Add support for nested documents and collections.
  - Implement transactions or batch updates.

- **Deploy to Production:**
  - Deploy the backend to Cloudflare and the frontend to a static site host (e.g., Cloudflare Pages).
  - Monitor performance and usage.

- **Documentation:**
  - Write public-facing documentation if this project is open-sourced.

# Code Structure

## Backend
- **`server.ts`:**  
  The Cloudflare Worker and Durable Object logic.

- **`blaze.ts`:**  
  The client-side library for interacting with the backend.

## Frontend
- **`App.svelte`:**  
  The demo UI built with Svelte and Tailwind CSS.
