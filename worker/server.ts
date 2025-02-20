// server.ts

export interface Env {
  BLAZE: DurableObjectNamespace;
}

// Durable Object class for managing document state
export class BlazeDocument {
  private state: DurableObjectState;
  private storage: DurableObjectStorage;
  private connections: Set<WebSocket>;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.storage = state.storage;
    this.connections = new Set();
  }

  async fetch(request: Request) {
    const url = new URL(request.url);

    // Handle WebSocket connections
    if (request.headers.get("Upgrade") === "websocket") {
      const [client, server] = Object.values(new WebSocketPair());
      this.connections.add(server);

      server.accept();
      server.addEventListener("message", async (event) => {
        const { type, payload } = JSON.parse(event.data);

        switch (type) {
          case "GET":
            const data = (await this.storage.get("data")) || {};
            server.send(JSON.stringify({ type: "INIT", data }));
            break;

          case "UPDATE":
            await this.storage.put("data", payload);
            this.broadcast({ type: "UPDATE", data: payload });
            break;

          default:
            console.warn("Unknown message type:", type);
        }
      });

      server.addEventListener("close", () => {
        this.connections.delete(server);
      });

      return new Response(null, { status: 101, webSocket: client });
    }

    // Handle HTTP requests
    if (url.pathname.startsWith("/docs/")) {
      const id = url.pathname.split("/")[2];
      const data = (await this.storage.get("data")) || {};
      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Welcome to Blaze!", { status: 200 });
  }

  // Broadcast a message to all connected clients
  broadcast(message: any) {
    for (const client of this.connections) {
      try {
        client.send(JSON.stringify(message));
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    }
  }
}

// Worker entry point
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    // Route WebSocket and HTTP requests to the Durable Object
    if (url.pathname.startsWith("/docs/")) {
      const id = url.pathname.split("/")[2];
      const doId = env.BLAZE.idFromName(id);
      const doInstance = env.BLAZE.get(doId);
      return doInstance.fetch(request);
    }

    return new Response("Welcome to Blaze!", { status: 200 });
  },
} satisfies ExportedHandler<Env>;