// Minimal client SDK

interface DocumentData {
  [key: string]: any
}

interface DocumentSnapshot {
  data: () => DocumentData
}

export type TokenProvider = string | (() => Promise<string> | string)

function toBearer(token?: TokenProvider): Promise<string | undefined> {
  if (!token) return Promise.resolve(undefined)
  if (typeof token === 'string') return Promise.resolve(token)
  const v = token()
  return Promise.resolve(v as any)
}

export class Blaze {
  private endpoint: string
  private token?: TokenProvider

  constructor(endpoint: string, opts?: { token?: TokenProvider }) {
    this.endpoint = endpoint.replace(/\/$/, '')
    this.token = opts?.token
  }

  collection(name: string) {
    return {
      doc: (id: string) => this._docRef(name, id),
    }
  }

  private async _headers(): Promise<HeadersInit> {
    const t = await toBearer(this.token)
    return t ? { Authorization: `Bearer ${t}` } : {}
  }

  private _docRef(collection: string, id: string) {
    const base = `${this.endpoint}/collections/${encodeURIComponent(collection)}/docs/${encodeURIComponent(id)}`
    return {
      get: async (): Promise<DocumentSnapshot> => {
        const response = await fetch(base, { headers: await this._headers() })
        if (!response.ok) {
          throw new Error(`Failed to fetch document: ${response.status} ${response.statusText}`)
        }
        const data = await response.json()
        return { data: () => data }
      },
      onUpdate: (callback: (snapshot: DocumentSnapshot) => void): void => {
        let ws: WebSocket | null = null
        let retries = 0
        const connect = async () => {
          const t = await toBearer(this.token)
          const url = new URL(base.replace(/^http/, 'ws'))
          if (t) url.searchParams.set('token', t)
          ws = new WebSocket(url.toString())
          ws.onopen = () => {
            retries = 0
            ws!.send(JSON.stringify({ type: 'GET' }))
          }
          ws.onmessage = (event: MessageEvent) => {
            const message = JSON.parse(event.data)
            if (message.type === 'INIT' || message.type === 'UPDATE') {
              callback({ data: () => message.data })
            }
          }
          ws.onclose = () => {
            if (retries < 6) {
              const delay = Math.min(1000 * 2 ** retries, 10000)
              retries++
              setTimeout(connect, delay)
            }
          }
        }
        connect()
      },
      update: async (data: DocumentData): Promise<void> => {
        const response = await fetch(base, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...(await this._headers()) },
          body: JSON.stringify(data),
        })
        if (!response.ok && response.status !== 204) {
          throw new Error(`Failed to update document: ${response.status} ${response.statusText}`)
        }
      },
      delete: async (): Promise<void> => {
        const response = await fetch(base, { method: 'DELETE', headers: await this._headers() })
        if (!response.ok && response.status !== 204) {
          throw new Error(`Failed to delete document: ${response.status} ${response.statusText}`)
        }
      },
    }
  }
}