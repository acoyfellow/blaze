<script lang="ts">
  import type { ChatMessage } from "./ChatService";

  interface Props {
    messages: ChatMessage[]
    isConnected: boolean
    onSendMessage: (content: string) => void
  }

  let { messages, isConnected, onSendMessage }: Props = $props()
  
  let messageInput = $state("")
  let chatContainer: HTMLDivElement

  function handleSendMessage() {
    if (!messageInput.trim() || !isConnected) return
    
    onSendMessage(messageInput.trim())
    messageInput = ""
  }

  function formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString()
  }

  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      handleSendMessage()
    }
  }

  // Auto-scroll to bottom when new messages arrive
  $effect(() => {
    if (chatContainer && messages.length > 0) {
      chatContainer.scrollTop = chatContainer.scrollHeight
    }
  })
</script>

<div class="bg-white rounded-lg shadow-sm border h-[600px] flex flex-col">
  <!-- Chat Header -->
  <div class="border-b p-4">
    <h2 class="text-lg font-semibold text-gray-900">Chat</h2>
    <p class="text-sm text-gray-500">
      {isConnected ? "Connected" : "Disconnected"} • {messages.length} messages
    </p>
  </div>

  <!-- Messages Container -->
  <div 
    bind:this={chatContainer}
    class="flex-1 overflow-y-auto p-4 space-y-4"
  >
    {#if messages.length === 0}
      <div class="text-center text-gray-500 py-8">
        <p>No messages yet. Start a conversation!</p>
      </div>
    {:else}
      {#each messages as message (message.id)}
        <div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
          <div class="max-w-xs lg:max-w-md">
            <div class="bg-{message.role === 'user' ? 'blue-600' : 'gray-200'} text-{message.role === 'user' ? 'white' : 'gray-900'} rounded-lg px-4 py-2">
              <p class="text-sm">{message.content}</p>
              {#if message.sources && message.sources.length > 0}
                <div class="mt-2 pt-2 border-t border-{message.role === 'user' ? 'blue-500' : 'gray-300'}">
                  <p class="text-xs opacity-75">Sources:</p>
                  <ul class="text-xs opacity-75 mt-1">
                    {#each message.sources as source}
                      <li>• {source}</li>
                    {/each}
                  </ul>
                </div>
              {/if}
            </div>
            <p class="text-xs text-gray-500 mt-1 {message.role === 'user' ? 'text-right' : 'text-left'}">
              {formatTime(message.timestamp)}
            </p>
          </div>
        </div>
      {/each}
    {/if}
  </div>

  <!-- Message Input -->
  <div class="border-t p-4">
    <div class="flex space-x-2">
      <textarea
        bind:value={messageInput}
        onkeypress={handleKeyPress}
        placeholder={isConnected ? "Type your message..." : "Disconnected"}
        disabled={!isConnected}
        class="flex-1 resize-none border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        rows="2"
      ></textarea>
      <button
        onclick={handleSendMessage}
        disabled={!isConnected || !messageInput.trim()}
        class="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Send
      </button>
    </div>
  </div>
</div>