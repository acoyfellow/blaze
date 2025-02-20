<script lang="ts">
  import PartySocket from 'partysocket'
  import { onMount } from 'svelte'

  const ws = new PartySocket({
    host: window.location.host,
    room: 'room1',
    party: 'my-server',
  })

  let message = $state()

  onMount(() => {
    ws.addEventListener('message', onMessage)
    ws.send('hello from the client!')
  })

  function onMessage(event: MessageEvent) {
    message = event.data
  }
</script>

<main>
  <div>
    <a href="https://vite.dev" target="_blank" rel="noreferrer">
      <img src='/vite.svg' class="logo" alt="Vite Logo" />
    </a>
    <a href="https://svelte.dev" target="_blank" rel="noreferrer">
      <img src='/svelte.svg' class="logo svelte" alt="Svelte Logo" />
    </a>
    <a href="https://partykit.io" target="_blank" rel="noreferrer">
      <img src='/partykit.png' class="logo" alt="PartyKit Logo" />
    </a>
  </div>
  <h1>Vite + Svelte + PartyKit</h1>

  <p class="read-the-docs">
    Click on the PartyKit, Vite and Svelte logos to learn more
  </p>

  <div class="card">
    {message}
  </div>
</main>

<style>
  .logo {
    height: 6em;
    padding: 1.5em;
    will-change: filter;
    transition: filter 300ms;
  }
  .logo:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
  }
  .logo.svelte:hover {
    filter: drop-shadow(0 0 2em #ff3e00aa);
  }
  .read-the-docs {
    color: #888;
  }
</style>
