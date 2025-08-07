<script lang="ts">
  import { onMount } from "svelte";
  import Blaze from "./lib/blaze";

  let docId = $state("mydoc");
  let docData: Record<string, any> | null = $state(null);
  let newData = $state({
    name: "",
    age: "",
  });
  let status = $state("");
  let isConnected = $state(false);

  // Provide token function (replace with Better Auth token in real app)
  const blaze = new Blaze(window.location.origin, {
    token: async () => localStorage.getItem('demo_token') || '',
  });
  let docRef: any;

  function initializeDoc() {
    docRef = blaze.collection("docs").doc(docId);
    fetchDoc();
    listenForUpdates();
  }

  async function fetchDoc() {
    try {
      const doc = await docRef.get();
      docData = doc.data();
      status = "Document loaded successfully";
    } catch (error) {
      status = "Error loading document";
    }
  }

  function listenForUpdates() {
    docRef.onUpdate((snapshot) => {
      docData = snapshot.data();
      isConnected = true;
      status = "Real-time connection active";
    });
  }

  async function updateDoc(e: Event) {
    e.preventDefault();
    try {
      await docRef.update(newData);
      status = "Document updated successfully";
      newData = { name: "", age: "" };
    } catch (error) {
      status = "Error updating document";
    }
  }

  $effect(() => {
    if (docId) {
      initializeDoc();
    }
  });

  onMount(() => {
    initializeDoc();
  });
</script>

<div class="p-8 bg-gray-100 min-h-screen">
  <h1 class="text-3xl font-bold mb-8">Blaze Demo</h1>
  <div class="mb-4 text-sm text-gray-600">
    Set a demo token in localStorage key <code>demo_token</code> to call authenticated endpoints.
  </div>

  <!-- Document ID Input -->
  <div class="mb-8 bg-white p-6 rounded shadow">
    <h2 class="text-xl font-semibold mb-4">Document Settings</h2>
    <div class="flex items-center gap-4">
      <div class="flex-1">
        <label for="docId" class="block text-sm font-medium text-gray-700"
          >Document ID</label
        >
        <input
          id="docId"
          bind:value={docId}
          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          placeholder="Enter document ID"
        />
      </div>
      <div class="flex items-center">
        <span
          class="text-sm {isConnected ? 'text-green-600' : 'text-gray-500'}"
        >
          {isConnected ? "🟢 Connected" : "⚪ Disconnected"}
        </span>
      </div>
    </div>
  </div>

  {#if status}
    <div
      class="mb-4 p-4 rounded {status.includes('Error')
        ? 'bg-red-100 text-red-700'
        : 'bg-green-100 text-green-700'}"
    >
      {status}
    </div>
  {/if}

  <!-- Display Document Data -->
  <div class="mb-8">
    <h2 class="text-xl font-semibold mb-4">Document Data</h2>
    {#if docData}
      <pre class="bg-white p-4 rounded shadow">{JSON.stringify(
          docData,
          null,
          2,
        )}</pre>
    {:else}
      <p class="text-gray-600">Loading...</p>
    {/if}
  </div>

  <!-- Update Document Form -->
  <div class="bg-white p-6 rounded shadow">
    <h2 class="text-xl font-semibold mb-4">Update Document</h2>
    <form onsubmit={updateDoc} class="space-y-4">
      <div>
        <label for="name" class="block text-sm font-medium text-gray-700"
          >Name</label
        >
        <input
          id="name"
          bind:value={newData.name}
          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          placeholder="Enter name"
        />
      </div>
      <div>
        <label for="age" class="block text-sm font-medium text-gray-700"
          >Age</label
        >
        <input
          id="age"
          bind:value={newData.age}
          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          placeholder="Enter age"
        />
      </div>
      <button
        type="submit"
        class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
      >
        Update Document
      </button>
    </form>
  </div>
</div>
