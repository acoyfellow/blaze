# Blaze Chatbot - RAG-Powered Document Chat

A modern end-to-end proof of concept for a document-powered chatbot built with Cloudflare Workers, TypeScript, and Svelte. Upload documents and chat with them using AI-powered Retrieval-Augmented Generation (RAG).

## Features

- 📄 **Document Upload**: Support for TXT, MD, PDF, DOC, DOCX, and HTML files
- 🤖 **AI Chat**: Powered by Cloudflare AI with Llama 2 model
- 🔍 **Smart Search**: Vector similarity search using BGE embeddings
- 💬 **Real-time Chat**: WebSocket-based live chat interface
- 📊 **Document Management**: View and manage uploaded documents
- 🎨 **Modern UI**: Clean, responsive design with Tailwind CSS
- 🌐 **Edge Computing**: Deployed on Cloudflare's global edge network

## Architecture

### Backend (Cloudflare Worker)
- **Durable Objects**: Persistent storage for chat messages and documents
- **R2 Storage**: Document file storage
- **AI Integration**: Cloudflare AI for embeddings and text generation
- **WebSocket Support**: Real-time bidirectional communication
- **RAG Pipeline**: Automatic text chunking, embedding, and similarity search

### Frontend (Svelte)
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Real-time Updates**: WebSocket client for live chat
- **File Upload**: Drag-and-drop document upload
- **Responsive Design**: Mobile-friendly interface

## Setup Instructions

### Prerequisites
- Node.js (v18 or later)
- Cloudflare account
- Wrangler CLI installed globally

### 1. Clone and Install
```bash
git clone <repository-url>
cd blaze-chatbot
npm install
```

### 2. Cloudflare Setup
```bash
# Login to Cloudflare
wrangler login

# Create R2 bucket for documents
wrangler r2 bucket create blaze-documents

# Deploy the worker
npm run deploy
```

### 3. Environment Configuration
The project uses the following Cloudflare bindings:
- `BLAZE`: Durable Object for chat state
- `DOCUMENTS`: R2 bucket for document storage
- `AI`: Cloudflare AI service

These are configured in `wrangler.json` and will be automatically set up during deployment.

### 4. Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage

### Uploading Documents
1. Navigate to the **Documents** tab or use the sidebar upload area
2. Drag and drop files or click to select
3. Supported formats: TXT, MD, PDF, DOC, DOCX, HTML (max 10MB)
4. Documents are automatically processed and embedded for search

### Chatting
1. Go to the **Chat** tab
2. Type your questions in the message input
3. The AI will search through your uploaded documents for relevant context
4. Responses include source document references when applicable

### Document Management
- View all uploaded documents in the **Documents** tab
- See processing status and upload timestamps
- Documents are automatically indexed for search

## Technical Implementation

### RAG Pipeline
1. **Document Processing**: Text extraction and chunking (500-character chunks)
2. **Embedding Generation**: Using Cloudflare's BGE model for vector embeddings
3. **Storage**: Documents and embeddings stored in Durable Objects and R2
4. **Query Processing**: User queries are embedded and matched against document chunks
5. **Response Generation**: Llama 2 model generates responses with document context

### Key Components

#### Worker (`worker/server.ts`)
- Main entry point for the Cloudflare Worker
- Handles HTTP requests and WebSocket connections
- Implements the RAG pipeline with document processing and search
- Manages Durable Object state and R2 storage

#### Frontend (`src/`)
- **App.svelte**: Main application component with tab navigation
- **ChatService.ts**: WebSocket client for real-time communication
- **ChatInterface.svelte**: Chat UI with message history
- **DocumentUpload.svelte**: File upload component with drag-and-drop
- **DocumentList.svelte**: Document management interface

### API Endpoints
- `POST /api/upload`: Upload documents
- `GET /api/documents`: List uploaded documents
- `GET /api/messages`: Get chat history
- `WS /api/`: WebSocket connection for real-time chat

## Configuration

### Wrangler Configuration (`wrangler.json`)
```json
{
  "name": "blaze",
  "main": "./worker/server.ts",
  "durable_objects": {
    "bindings": [{ "name": "BLAZE", "class_name": "BlazeDocument" }]
  },
  "r2_buckets": [{ "binding": "DOCUMENTS", "bucket_name": "blaze-documents" }],
  "ai": { "binding": "AI" }
}
```

### Supported File Types
- **Text**: `.txt`, `.md`
- **Documents**: `.pdf`, `.doc`, `.docx`
- **Web**: `.html`
- **Size Limit**: 10MB per file

## Deployment

### Production Deployment
```bash
# Build and deploy
npm run deploy

# Or manually
npm run build
wrangler deploy
```

### Environment Variables
The application uses Cloudflare bindings instead of environment variables:
- Durable Objects for persistent storage
- R2 for file storage
- AI service for embeddings and text generation

## Limitations & Considerations

### Current Limitations
- PDF text extraction is basic (may need improvement for complex PDFs)
- No user authentication (single-user prototype)
- Limited to 10MB file uploads
- Basic error handling for AI service failures

### Production Considerations
- Add user authentication and authorization
- Implement rate limiting for API endpoints
- Add document deletion functionality
- Improve error handling and logging
- Add monitoring and analytics
- Implement document versioning
- Add support for more file formats

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
1. Check the GitHub Issues page
2. Review the Cloudflare Workers documentation
3. Check the Svelte documentation for frontend issues

## Tech Stack

- **Runtime**: Cloudflare Workers
- **Backend**: TypeScript, Durable Objects, R2
- **Frontend**: Svelte 5, TypeScript, Tailwind CSS
- **AI**: Cloudflare AI (BGE embeddings, Llama 2)
- **Build**: Vite, Wrangler
- **Deployment**: Cloudflare Edge Network

---

Built with ❤️ using Cloudflare Workers and modern web technologies.