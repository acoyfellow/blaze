/// <reference types="@cloudflare/workers-types" />

// Environment interface
export interface Env {
  BLAZE: DurableObjectNamespace
  DOCUMENTS: R2Bucket
  AI: Ai
}

// Types
interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: number
  sources?: string[]
}

interface Document {
  id: string
  name: string
  content: string
  chunks: DocumentChunk[]
  uploadedAt: number
}

interface DocumentChunk {
  id: string
  content: string
  embedding: number[]
}

interface WebSocketMessage {
  type: "chat" | "upload" | "get_messages" | "get_documents"
  payload?: any
}

// Utility functions
function chunkText(text: string, chunkSize: number = 500): string[] {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const chunks: string[] = []
  let currentChunk = ""
  
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim())
      currentChunk = sentence
    } else {
      currentChunk += (currentChunk.length > 0 ? ". " : "") + sentence
    }
  }
  
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.trim())
  }
  
  return chunks
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
  return dotProduct / (magnitudeA * magnitudeB)
}

// Durable Object class
export class BlazeDocument {
  private state: DurableObjectState
  private storage: DurableObjectStorage
  private connections: Set<WebSocket>
  private env: Env

  constructor(state: DurableObjectState, env: Env) {
    this.state = state
    this.storage = state.storage
    this.connections = new Set()
    this.env = env
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    // Handle WebSocket connections
    if (request.headers.get("Upgrade") === "websocket") {
      return this.handleWebSocket(request)
    }

    // Handle HTTP requests
    if (request.method === "POST" && url.pathname === "/upload") {
      return this.handleFileUpload(request)
    }

    if (request.method === "GET" && url.pathname === "/documents") {
      return this.handleGetDocuments()
    }

    if (request.method === "GET" && url.pathname === "/messages") {
      return this.handleGetMessages()
    }

    return new Response("Blaze Chatbot API", { status: 200 })
  }

  private async handleWebSocket(request: Request): Promise<Response> {
    const [client, server] = Object.values(new WebSocketPair())
    this.connections.add(server)

    server.accept()
    server.addEventListener("message", async (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data as string)
        await this.handleWebSocketMessage(message, server)
      } catch (error) {
        console.error("WebSocket message error:", error)
        server.send(JSON.stringify({ type: "error", message: "Invalid message format" }))
      }
    })

    server.addEventListener("close", () => {
      this.connections.delete(server)
    })

    return new Response(null, { status: 101, webSocket: client })
  }

  private async handleWebSocketMessage(message: WebSocketMessage, socket: WebSocket): Promise<void> {
    try {
      switch (message.type) {
        case "chat":
          await this.handleChatMessage(message.payload?.content || "", socket)
          break
        case "get_messages":
          await this.sendMessages(socket)
          break
        case "get_documents":
          await this.sendDocuments(socket)
          break
        default:
          socket.send(JSON.stringify({ type: "error", message: "Unknown message type" }))
      }
    } catch (error) {
      console.error("Message handling error:", error)
      socket.send(JSON.stringify({ type: "error", message: "Failed to handle message" }))
    }
  }

  private async handleFileUpload(request: Request): Promise<Response> {
    try {
      const formData = await request.formData()
      const file = formData.get("file") as File
      
      if (!file) {
        return new Response("No file provided", { status: 400 })
      }

      const content = await file.text()
      const document = await this.uploadDocument(file.name, content)
      
      // Broadcast to all connected clients
      this.broadcast({ type: "document_uploaded", document: {
        id: document.id,
        name: document.name,
        uploadedAt: document.uploadedAt
      }})
      
      return new Response(JSON.stringify({
        id: document.id,
        name: document.name,
        uploadedAt: document.uploadedAt
      }), {
        headers: { "Content-Type": "application/json" }
      })
    } catch (error) {
      console.error("File upload error:", error)
      return new Response("Upload failed", { status: 500 })
    }
  }

  private async handleGetDocuments(): Promise<Response> {
    try {
      const documents = await this.getDocuments()
      const result = documents.map(doc => ({
        id: doc.id,
        name: doc.name,
        uploadedAt: doc.uploadedAt
      }))
      
      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" }
      })
    } catch (error) {
      console.error("Get documents error:", error)
      return new Response("Failed to get documents", { status: 500 })
    }
  }

  private async handleGetMessages(): Promise<Response> {
    try {
      const messages = await this.getMessages()
      return new Response(JSON.stringify(messages), {
        headers: { "Content-Type": "application/json" }
      })
    } catch (error) {
      console.error("Get messages error:", error)
      return new Response("Failed to get messages", { status: 500 })
    }
  }

  private async handleChatMessage(content: string, socket: WebSocket): Promise<void> {
    try {
      // Save user message
      const userMessage = await this.addMessage({
        role: "user",
        content,
        sources: []
      })

      // Broadcast user message
      this.broadcast({ type: "user_message", message: userMessage })

      // Search for similar content
      const similarChunks = await this.searchSimilarChunks(content, 3)
      
      // Generate response
      const context = similarChunks.map(chunk => 
        `Document: ${chunk.documentName}\nContent: ${chunk.content}`
      ).join("\n\n")
      
      const response = await this.generateResponse(content, context)
      
      // Save assistant message
      const assistantMessage = await this.addMessage({
        role: "assistant",
        content: response,
        sources: similarChunks.map(chunk => chunk.documentName)
      })

      // Broadcast assistant message
      this.broadcast({ type: "chat_response", message: assistantMessage })
    } catch (error) {
      console.error("Chat message error:", error)
      socket.send(JSON.stringify({ type: "error", message: "Failed to process chat message" }))
    }
  }

  private async sendMessages(socket: WebSocket): Promise<void> {
    const messages = await this.getMessages()
    socket.send(JSON.stringify({ type: "messages", messages }))
  }

  private async sendDocuments(socket: WebSocket): Promise<void> {
    const documents = await this.getDocuments()
    const result = documents.map(doc => ({
      id: doc.id,
      name: doc.name,
      uploadedAt: doc.uploadedAt
    }))
    socket.send(JSON.stringify({ type: "documents", documents: result }))
  }

  private async uploadDocument(name: string, content: string): Promise<Document> {
    const id = crypto.randomUUID()
    const chunks = chunkText(content)
    
    // Generate embeddings for chunks
    const chunksWithEmbeddings: DocumentChunk[] = []
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      try {
        const embedding = await this.env.AI.run("@cf/baai/bge-base-en-v1.5", {
          text: chunk
        }) as { data: number[][] }
        
        chunksWithEmbeddings.push({
          id: `${id}-chunk-${i}`,
          content: chunk,
          embedding: embedding.data[0]
        })
      } catch (error) {
        console.error("Embedding generation error:", error)
        // Use empty embedding as fallback
        chunksWithEmbeddings.push({
          id: `${id}-chunk-${i}`,
          content: chunk,
          embedding: []
        })
      }
    }

    const document: Document = {
      id,
      name,
      content,
      chunks: chunksWithEmbeddings,
      uploadedAt: Date.now()
    }

    // Store in R2
    await this.env.DOCUMENTS.put(`documents/${id}`, JSON.stringify(document))

    // Store in Durable Object storage
    await this.storage.put(`document:${id}`, document)

    return document
  }

  private async getDocuments(): Promise<Document[]> {
    const keys = await this.storage.list({ prefix: "document:" })
    const documents: Document[] = []
    
    for (const key of keys.keys()) {
      const doc = await this.storage.get(key) as Document
      if (doc) {
        documents.push(doc)
      }
    }
    
    return documents
  }

  private async searchSimilarChunks(query: string, limit: number = 3): Promise<Array<{ content: string; documentName: string }>> {
    try {
      // Generate query embedding
      const queryEmbedding = await this.env.AI.run("@cf/baai/bge-base-en-v1.5", {
        text: query
      }) as { data: number[][] }
      
      const queryVector = queryEmbedding.data[0]
      
      // Get all documents
      const documents = await this.getDocuments()
      
      // Calculate similarities
      const allChunks = documents.flatMap(doc => 
        doc.chunks.map(chunk => ({
          ...chunk,
          documentName: doc.name,
          similarity: chunk.embedding.length > 0 ? cosineSimilarity(queryVector, chunk.embedding) : 0
        }))
      )

      // Sort by similarity and return top results
      return allChunks
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
        .map(chunk => ({
          content: chunk.content,
          documentName: chunk.documentName
        }))
    } catch (error) {
      console.error("Search error:", error)
      return []
    }
  }

  private async addMessage(message: Omit<ChatMessage, "id" | "timestamp">): Promise<ChatMessage> {
    const chatMessage: ChatMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    }

    await this.storage.put(`message:${chatMessage.id}`, chatMessage)
    return chatMessage
  }

  private async getMessages(): Promise<ChatMessage[]> {
    const keys = await this.storage.list({ prefix: "message:" })
    const messages: ChatMessage[] = []
    
    for (const key of keys.keys()) {
      const msg = await this.storage.get(key) as ChatMessage
      if (msg) {
        messages.push(msg)
      }
    }
    
    return messages.sort((a, b) => a.timestamp - b.timestamp)
  }

  private async generateResponse(userMessage: string, context: string): Promise<string> {
    try {
      const prompt = `You are a helpful assistant that answers questions based on the provided context. Use the context to answer the user's question. If the context doesn't contain relevant information, say so.

Context:
${context}

User Question: ${userMessage}

Answer:`

      const response = await this.env.AI.run("@cf/meta/llama-2-7b-chat-int8", {
        prompt,
        max_tokens: 500
      }) as { response: string }

      return response.response
    } catch (error) {
      console.error("AI generation error:", error)
      return "I'm sorry, I couldn't generate a response at this time."
    }
  }

  private broadcast(message: any): void {
    for (const client of this.connections) {
      try {
        client.send(JSON.stringify(message))
      } catch (error) {
        console.error("Failed to send message:", error)
        this.connections.delete(client)
      }
    }
  }
}

// Worker entry point
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)

    // Route to Durable Object
    if (url.pathname.startsWith("/api/")) {
      const doId = env.BLAZE.idFromName("chatbot")
      const doInstance = env.BLAZE.get(doId)
      
      // Remove /api prefix before forwarding
      const newUrl = new URL(request.url)
      newUrl.pathname = newUrl.pathname.replace("/api", "")
      
      const newRequest = new Request(newUrl, request)
      return doInstance.fetch(newRequest)
    }

    // Handle CORS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }
      })
    }

    return new Response("Blaze Chatbot API", { status: 200 })
  }
} satisfies ExportedHandler<Env>