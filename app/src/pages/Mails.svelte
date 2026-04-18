<script lang="ts">
  import { rpcGet } from '../lib/rpc-client.effects.ts'

  let status = $state<'idle' | 'pinging' | 'ok' | 'err'>('idle')
  let payload = $state<unknown>(null)
  let errMsg = $state('')

  async function ping() {
    status = 'pinging'
    const r = await rpcGet<{ pong: true; ts: number }>('ping')
    if (r.ok) {
      status = 'ok'
      payload = r.value
    } else {
      status = 'err'
      errMsg = r.error.message
    }
  }
</script>

<div class="space-y-4 max-w-3xl">
  <div>
    <h1 class="text-2xl font-semibold">Home</h1>
    <p class="text-base-content/60">Grouped email view placeholder.</p>
  </div>

  <div class="card bg-base-100 shadow-sm">
    <div class="card-body">
      <h2 class="card-title text-base">RPC smoke test</h2>
      <div class="flex items-center gap-2">
        <button type="button" class="btn btn-primary btn-sm" onclick={ping}>Ping server</button>
        {#if status === 'pinging'}
          <span class="loading loading-dots loading-sm"></span>
        {/if}
      </div>
      {#if status === 'ok'}
        <div class="mockup-code text-xs mt-2"><pre><code>{JSON.stringify(payload, null, 2)}</code></pre></div>
      {:else if status === 'err'}
        <div class="alert alert-error alert-sm mt-2">
          <span>{errMsg}</span>
        </div>
      {/if}
    </div>
  </div>
</div>
