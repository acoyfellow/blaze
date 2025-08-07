// server.ts

export interface Env {
  BLAZE: DurableObjectNamespace
  // Optional Better Auth integration
  BETTER_AUTH_JWKS_URL?: string
  BETTER_AUTH_ISSUER?: string
  BETTER_AUTH_AUDIENCE?: string
  BETTER_AUTH_HMAC_SECRET?: string
  // CORS
  ALLOWED_ORIGINS?: string // comma-separated
}

import { jwtVerify, createRemoteJWKSet, JWTPayload } from 'jose'

// ---- Small auth helper ----
async function verifyAuthToken(request: Request, env: Env): Promise<{ ok: true; payload: JWTPayload } | { ok: false; status: number; body: string }> {
  const url = new URL(request.url)
  const authHeader = request.headers.get('authorization') || ''
  const headerToken = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : ''

  const urlToken = url.searchParams.get('token') || ''

  // For WS, allow Sec-WebSocket-Protocol: bearer,<token>
  const wsProto = request.headers.get('sec-websocket-protocol') || ''
  const protoParts = wsProto.split(',').map((s) => s.trim())
  const protoToken = protoParts[0] === 'bearer' && protoParts[1] ? protoParts[1] : ''

  const token = headerToken || protoToken || urlToken
  if (!token) {
    return { ok: false, status: 401, body: 'missing token' }
  }

  try {
    // Prefer RS256 via JWKS if provided
    if (env.BETTER_AUTH_JWKS_URL) {
      const JWKS = createRemoteJWKSet(new URL(env.BETTER_AUTH_JWKS_URL))
      const { payload } = await jwtVerify(token, JWKS, {
        issuer: env.BETTER_AUTH_ISSUER,
        audience: env.BETTER_AUTH_AUDIENCE,
      })
      return { ok: true, payload }
    }

    // Fallback to HS256 via shared secret
    if (env.BETTER_AUTH_HMAC_SECRET) {
      const key = new TextEncoder().encode(env.BETTER_AUTH_HMAC_SECRET)
      const { payload } = await jwtVerify(token, key, {
        issuer: env.BETTER_AUTH_ISSUER,
        audience: env.BETTER_AUTH_AUDIENCE,
      })
      return { ok: true, payload }
    }

    // If no config provided, reject by default for safety
    return { ok: false, status: 500, body: 'auth not configured' }
  } catch (err: any) {
    return { ok: false, status: 401, body: 'invalid token' }
  }
}

function corsHeaders(origin: string | null, env: Env): HeadersInit {
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean)
  const allowOrigin = allowed.length === 0 ? '*' : (origin && allowed.includes(origin) ? origin : allowed[0])
  return {
    'Access-Control-Allow-Origin': allowOrigin || '*',
    'Access-Control-Allow-Headers': 'authorization,content-type',
    'Access-Control-Allow-Methods': 'GET,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  }
}

// Durable Object class for managing document state
export class BlazeDocument {
  private state: DurableObjectState
  private storage: DurableObjectStorage
  private connections: Set<WebSocket>

  constructor(state: DurableObjectState, env: Env) {
    this.state = state
    this.storage = state.storage
    this.connections = new Set()
  }

  async fetch(request: Request, env: Env) {
    const url = new URL(request.url)

    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request.headers.get('origin'), env) })
    }

    // WebSocket
    if (request.headers.get('Upgrade') === 'websocket') {
      const auth = await verifyAuthToken(request, env)
      if (!('ok' in auth) || !auth.ok) {
        return new Response(auth.body, { status: auth.status, headers: corsHeaders(request.headers.get('origin'), env) })
      }

      const pair = new WebSocketPair()
      const client = pair[0]
      const server = pair[1]

      server.accept()
      this.connections.add(server)

      server.addEventListener('message', async (event) => {
        try {
          const { type, payload } = JSON.parse(event.data)
          switch (type) {
            case 'GET': {
              const data = (await this.storage.get('data')) || {}
              server.send(JSON.stringify({ type: 'INIT', data }))
              break
            }
            case 'UPDATE': {
              await this.storage.put('data', payload)
              this.broadcast({ type: 'UPDATE', data: payload })
              break
            }
            default:
              // ignore
              break
          }
        } catch {
          // ignore malformed
        }
      })

      server.addEventListener('close', () => {
        this.connections.delete(server)
      })

      return new Response(null, { status: 101, webSocket: client, headers: corsHeaders(request.headers.get('origin'), env) })
    }

    // HTTP
    if (url.pathname.startsWith('/collections/')) {
      const parts = url.pathname.split('/')
      // /collections/:collection/docs/:id
      const collection = parts[2]
      const id = parts[4]
      if (!collection || !id) {
        return new Response('bad path', { status: 400, headers: corsHeaders(request.headers.get('origin'), env) })
      }

      const auth = await verifyAuthToken(request, env)
      if (!('ok' in auth) || !auth.ok) {
        return new Response(auth.body, { status: auth.status, headers: corsHeaders(request.headers.get('origin'), env) })
      }

      switch (request.method) {
        case 'GET': {
          const data = (await this.storage.get('data')) || {}
          return new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders(request.headers.get('origin'), env) },
          })
        }
        case 'PUT':
        case 'PATCH': {
          const body = await request.json().catch(() => ({}))
          await this.storage.put('data', body)
          this.broadcast({ type: 'UPDATE', data: body })
          return new Response(null, { status: 204, headers: corsHeaders(request.headers.get('origin'), env) })
        }
        case 'DELETE': {
          await this.storage.delete('data')
          this.broadcast({ type: 'UPDATE', data: {} })
          return new Response(null, { status: 204, headers: corsHeaders(request.headers.get('origin'), env) })
        }
      }
    }

    return new Response('OK', { status: 200, headers: corsHeaders(request.headers.get('origin'), env) })
  }

  // Broadcast a message to all connected clients
  broadcast(message: any) {
    for (const client of this.connections) {
      try {
        client.send(JSON.stringify(message))
      } catch {
        // ignore
      }
    }
  }
}

// Worker entry point
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url)

    // Route to DO: name by `${collection}:${id}`
    if (url.pathname.startsWith('/collections/')) {
      const parts = url.pathname.split('/')
      const collection = parts[2]
      const id = parts[4]
      if (!collection || !id) {
        return new Response('bad path', { status: 400, headers: corsHeaders(request.headers.get('origin'), env) })
      }
      const doId = env.BLAZE.idFromName(`${collection}:${id}`)
      const doInstance = env.BLAZE.get(doId)
      return doInstance.fetch(request)
    }

    // Health
    if (url.pathname === '/health') {
      return new Response('ok', { headers: corsHeaders(request.headers.get('origin'), env) })
    }

    return new Response('Blaze', { status: 200, headers: corsHeaders(request.headers.get('origin'), env) })
  },
} satisfies ExportedHandler<Env>