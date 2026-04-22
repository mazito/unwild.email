<script lang="ts">
  import { rpcGet } from '../lib/rpc-client.effects.ts'

  let info = $state<unknown>(null)
  let err = $state('')

  async function load() {
    const r = await rpcGet<{ name: string; version: string }>('server.info')
    if (r.ok) info = r.value
    else err = r.error.message
  }
  load()
</script>

<div class="max-w-3xl space-y-3">
  <h1 class="text-2xl font-semibold">Monitor</h1>

  {#if info}
    <div class="mockup-code text-xs"><pre><code>{JSON.stringify(info, null, 2)}</code></pre></div>
  {:else if err}
    <div class="alert alert-error"><span>{err}</span></div>
  {:else}
    <span class="loading loading-dots loading-sm"></span>
  {/if}

  <p class="text-base-content/60 text-sm">
    Also available at <a class="link link-primary" href="/monitor" target="_blank" rel="noopener">/monitor</a>.
  </p>
</div>
