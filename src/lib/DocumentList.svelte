<script lang="ts">
  import type { Document } from "./ChatService";

  interface Props {
    documents: Document[]
    detailed?: boolean
  }

  let { documents, detailed = false }: Props = $props()

  function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  function getFileIcon(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'pdf':
        return '📄'
      case 'doc':
      case 'docx':
        return '📝'
      case 'txt':
        return '📃'
      case 'md':
        return '📋'
      case 'html':
        return '🌐'
      default:
        return '📄'
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }
</script>

<div class="bg-white rounded-lg shadow-sm border">
  <div class="p-4 border-b">
    <h3 class="text-lg font-semibold text-gray-900">
      Documents ({documents.length})
    </h3>
    {#if !detailed}
      <p class="text-sm text-gray-500">Uploaded documents for context</p>
    {/if}
  </div>

  <div class="p-4">
    {#if documents.length === 0}
      <div class="text-center py-8">
        <div class="w-12 h-12 mx-auto text-gray-400 mb-4">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
        </div>
        <p class="text-sm text-gray-500">No documents uploaded yet</p>
        <p class="text-xs text-gray-400 mt-1">Upload documents to enhance chat responses</p>
      </div>
    {:else}
      <div class="space-y-3">
        {#each documents as document (document.id)}
          <div class="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
            <div class="flex-shrink-0">
              <span class="text-2xl">{getFileIcon(document.name)}</span>
            </div>
            
            <div class="flex-1 min-w-0">
              <div class="flex items-center space-x-2">
                <p class="text-sm font-medium text-gray-900 truncate">
                  {document.name}
                </p>
                {#if detailed}
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Processed
                  </span>
                {/if}
              </div>
              
              <div class="flex items-center space-x-2 mt-1">
                <p class="text-xs text-gray-500">
                  {formatDate(document.uploadedAt)}
                </p>
                {#if detailed}
                  <span class="text-xs text-gray-400">•</span>
                  <p class="text-xs text-gray-500">
                    ID: {document.id.substring(0, 8)}...
                  </p>
                {/if}
              </div>
              
              {#if detailed}
                <div class="mt-2 flex flex-wrap gap-1">
                  <span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                    Searchable
                  </span>
                  <span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                    Embedded
                  </span>
                </div>
              {/if}
            </div>

            {#if detailed}
              <div class="flex-shrink-0">
                <button class="text-gray-400 hover:text-red-500 focus:outline-none focus:text-red-500 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>

  {#if detailed && documents.length > 0}
    <div class="border-t p-4">
      <div class="flex items-center justify-between text-sm text-gray-500">
        <span>Total: {documents.length} document{documents.length !== 1 ? 's' : ''}</span>
        <button class="text-blue-600 hover:text-blue-700 font-medium">
          Refresh
        </button>
      </div>
    </div>
  {/if}
</div>