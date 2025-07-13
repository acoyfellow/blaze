<script lang="ts">
  interface Props {
    isConnected: boolean
    onUploadDocument: (file: File) => void
  }

  let { isConnected, onUploadDocument }: Props = $props()
  
  let fileInput: HTMLInputElement
  let isDragging = $state(false)
  let uploadProgress = $state(0)
  let isUploading = $state(false)

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement
    if (target.files && target.files.length > 0) {
      const file = target.files[0]
      uploadFile(file)
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault()
    isDragging = true
  }

  function handleDragLeave() {
    isDragging = false
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault()
    isDragging = false
    
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0]
      uploadFile(file)
    }
  }

  function uploadFile(file: File) {
    if (!isConnected) return
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB")
      return
    }

    // Check file type
    const allowedTypes = [
      'text/plain',
      'text/markdown',
      'application/pdf',
      'text/html',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      alert("Please upload a text, markdown, PDF, or Word document")
      return
    }

    isUploading = true
    uploadProgress = 0
    
    // Simulate upload progress
    const progressInterval = setInterval(() => {
      uploadProgress += 10
      if (uploadProgress >= 90) {
        clearInterval(progressInterval)
      }
    }, 100)

    onUploadDocument(file)
    
    // Reset after upload
    setTimeout(() => {
      isUploading = false
      uploadProgress = 0
      clearInterval(progressInterval)
      if (fileInput) {
        fileInput.value = ''
      }
    }, 2000)
  }

  function triggerFileInput() {
    fileInput?.click()
  }
</script>

<div class="bg-white rounded-lg shadow-sm border p-6">
  <h3 class="text-lg font-semibold text-gray-900 mb-4">Upload Document</h3>
  
  <!-- File Input -->
  <input
    bind:this={fileInput}
    type="file"
    accept=".txt,.md,.pdf,.doc,.docx,.html"
    onchange={handleFileSelect}
    class="hidden"
    disabled={!isConnected || isUploading}
  />

  <!-- Drop Zone -->
  <div
    class="border-2 border-dashed rounded-lg p-8 text-center transition-colors {isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'} {!isConnected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}"
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
    onclick={triggerFileInput}
  >
    {#if isUploading}
      <div class="space-y-4">
        <div class="w-8 h-8 mx-auto border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-sm text-gray-600">Uploading...</p>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div 
            class="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style="width: {uploadProgress}%"
          ></div>
        </div>
      </div>
    {:else}
      <div class="space-y-4">
        <div class="w-12 h-12 mx-auto text-gray-400">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
          </svg>
        </div>
        <div>
          <p class="text-sm text-gray-600">
            {isConnected ? "Drag and drop a file here, or click to select" : "Connect to upload documents"}
          </p>
          <p class="text-xs text-gray-500 mt-1">
            Supports: TXT, MD, PDF, DOC, DOCX, HTML (max 10MB)
          </p>
        </div>
      </div>
    {/if}
  </div>

  <!-- Upload Button -->
  <button
    onclick={triggerFileInput}
    disabled={!isConnected || isUploading}
    class="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
  >
    {isUploading ? "Uploading..." : "Select File"}
  </button>

  <!-- Help Text -->
  <div class="mt-4 text-xs text-gray-500">
    <p>💡 <strong>Tip:</strong> Upload documents that you want to ask questions about. The AI will use the content to provide more accurate answers.</p>
  </div>
</div>