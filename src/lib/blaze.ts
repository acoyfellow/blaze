// blaze.ts

interface DocumentData {
  [key: string]: any;
}

interface DocumentSnapshot {
  data: () => DocumentData;
}

export class Blaze {
  private endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  collection(name: string) {
    return {
      doc: (id: string) => this._docRef(name, id),
    };
  }

  private _docRef(collection: string, id: string) {
    return {
      get: async (): Promise<DocumentSnapshot> => {
        const response = await fetch(`${this.endpoint}/docs/${id}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch document: ${response.statusText}`);
        }
        const data = await response.json();
        return { data: () => data };
      },
      onUpdate: (callback: (snapshot: DocumentSnapshot) => void): void => {
        const ws = new WebSocket(`${this.endpoint.replace("http", "ws")}/docs/${id}`);

        ws.onmessage = (event: MessageEvent) => {
          const message = JSON.parse(event.data);
          if (message.type === "INIT" || message.type === "UPDATE") {
            callback({ data: () => message.data });
          }
        };

        ws.onopen = () => {
          ws.send(JSON.stringify({ type: "GET" }));
        };
      },
      update: async (data: DocumentData): Promise<void> => {
        const ws = new WebSocket(`${this.endpoint.replace("http", "ws")}/docs/${id}`);

        ws.onopen = () => {
          ws.send(JSON.stringify({ type: "UPDATE", payload: data }));
          ws.close();
        };
      },
    };
  }
}

export default Blaze;