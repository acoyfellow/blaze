export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: number
  sources?: string[]
}

export interface Document {
  id: string
  name: string
  uploadedAt: number
}

export interface ChatServiceCallbacks {
  onConnected?: () => void
  onDisconnected?: () => void
  onMessage?: (message: ChatMessage) => void
  onMessages?: (messages: ChatMessage[]) => void
  onDocuments?: (documents: Document[]) => void
  onDocumentUploaded?: (document: Document) => void
  onError?: (error: string) => void
}

export class ChatService {
  private endpoint: string
  private ws: WebSocket | null = null
  private callbacks: ChatServiceCallbacks = {}

  constructor(endpoint: string) {
    this.endpoint = endpoint
  }

  connect(callbacks: ChatServiceCallbacks) {
    this.callbacks = callbacks
    this.setupWebSocket()
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  private setupWebSocket() {
    const wsUrl = `${this.endpoint.replace("http", "ws")}/api/ws`
    this.ws = new WebSocket(wsUrl)

    this.ws.onopen = () => {
      console.log("WebSocket connected")
      this.callbacks.onConnected?.()
    }

    this.ws.onclose = () => {
      console.log("WebSocket disconnected")
      this.callbacks.onDisconnected?.()
      
      // Reconnect after 3 seconds
      setTimeout(() => {
        if (this.ws?.readyState === WebSocket.CLOSED) {
          this.setupWebSocket()
        }
      }, 3000)
    }

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error)
      this.callbacks.onError?.("WebSocket connection error")
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        this.handleMessage(data)
      } catch (error) {
        console.error("Error parsing WebSocket message:", error)
        this.callbacks.onError?.("Failed to parse server message")
      }
    }
  }

  private handleMessage(data: any) {
    switch (data.type) {
      case "user_message":
      case "chat_response":
        this.callbacks.onMessage?.(data.message)
        break
      case "messages":
        this.callbacks.onMessages?.(data.messages)
        break
      case "documents":
        this.callbacks.onDocuments?.(data.documents)
        break
      case "document_uploaded":
        this.callbacks.onDocumentUploaded?.(data.document)
        break
      case "error":
        this.callbacks.onError?.(data.message)
        break
      default:
        console.warn("Unknown message type:", data.type)
    }
  }

  sendMessage(content: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.callbacks.onError?.("Not connected to chat service")
      return
    }

    this.ws.send(JSON.stringify({
      type: "chat",
      payload: { content }
    }))
  }

  getMessages() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return
    }

    this.ws.send(JSON.stringify({
      type: "get_messages"
    }))
  }

  getDocuments() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return
    }

    this.ws.send(JSON.stringify({
      type: "get_documents"
    }))
  }

  async uploadDocument(file: File): Promise<void> {
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(`${this.endpoint}/api/upload`, {
        method: "POST",
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const result = await response.json()
      console.log("Upload successful:", result)
    } catch (error) {
      console.error("Upload error:", error)
      this.callbacks.onError?.(`Upload failed: ${error}`)
    }
  }
}