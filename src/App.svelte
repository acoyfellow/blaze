<script lang="ts">
  import { onMount } from "svelte";
  import ChatInterface from "./lib/ChatInterface.svelte";
  import DocumentUpload from "./lib/DocumentUpload.svelte";
  import DocumentList from "./lib/DocumentList.svelte";
  import { ChatService } from "./lib/ChatService";

  let activeTab = $state("chat");
  let status = $state("");
  let isConnected = $state(false);

  const chatService = new ChatService(window.location.origin);
  let messages = $state<any[]>([]);
  let documents = $state<any[]>([]);

  onMount(() => {
    initializeConnection();
  });

  function initializeConnection() {
    chatService.connect({
      onConnected: () => {
        isConnected = true;
        status = "Connected to chat service";
        chatService.getMessages();
        chatService.getDocuments();
      },
      onDisconnected: () => {
        isConnected = false;
        status = "Disconnected from chat service";
      },
      onMessage: (message) => {
        messages = [...messages, message];
      },
      onMessages: (allMessages) => {
        messages = allMessages;
      },
      onDocuments: (allDocuments) => {
        documents = allDocuments;
      },
      onDocumentUploaded: (document) => {
        documents = [...documents, document];
        status = `Document "${document.name}" uploaded successfully`;
      },
      onError: (error) => {
        status = `Error: ${error}`;
      }
    });
  }

  function sendMessage(content: string) {
    chatService.sendMessage(content);
  }

  function uploadDocument(file: File) {
    status = "Uploading document...";
    chatService.uploadDocument(file);
  }
</script>

<div class="min-h-screen bg-gray-50">
  <!-- Header -->
  <header class="bg-white shadow-sm border-b">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <div class="flex items-center">
          <h1 class="text-2xl font-bold text-gray-900">Blaze Chatbot</h1>
          <span class="ml-4 text-sm {isConnected ? 'text-green-600' : 'text-red-600'}">
            {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
          </span>
        </div>
        
        <nav class="flex space-x-4">
          <button 
            class="px-4 py-2 rounded-md text-sm font-medium {activeTab === 'chat' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}"
            onclick={() => activeTab = 'chat'}
          >
            Chat
          </button>
          <button 
            class="px-4 py-2 rounded-md text-sm font-medium {activeTab === 'documents' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}"
            onclick={() => activeTab = 'documents'}
          >
            Documents
          </button>
        </nav>
      </div>
    </div>
  </header>

  <!-- Status Bar -->
  {#if status}
    <div class="bg-blue-50 border-b border-blue-200 px-4 py-3">
      <div class="max-w-7xl mx-auto">
        <p class="text-sm text-blue-700">{status}</p>
      </div>
    </div>
  {/if}

  <!-- Main Content -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {#if activeTab === 'chat'}
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <!-- Chat Interface -->
        <div class="lg:col-span-3">
          <ChatInterface 
            {messages} 
            {isConnected}
            onSendMessage={sendMessage}
          />
        </div>
        
        <!-- Document Upload & List -->
        <div class="lg:col-span-1 space-y-6">
          <DocumentUpload 
            {isConnected}
            onUploadDocument={uploadDocument}
          />
          
          <DocumentList {documents} />
        </div>
      </div>
    {:else if activeTab === 'documents'}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-1">
          <DocumentUpload 
            {isConnected}
            onUploadDocument={uploadDocument}
          />
        </div>
        
        <div class="lg:col-span-2">
          <DocumentList {documents} detailed={true} />
        </div>
      </div>
    {/if}
  </main>
</div>
