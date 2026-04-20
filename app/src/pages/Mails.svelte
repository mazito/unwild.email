<script lang="ts">
  import { MoreVertical } from 'lucide-svelte'
  import FloatingSearch from '../components/FloatingSearch.svelte'
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

<!-- Page pattern: h-full flex col => fixed toolbar + scrollable content -->
<div class="relative h-full flex flex-col --border border-dashed overflow-hidden">

  <!-- Breadcrumbs -->
  <div class="shrink-0 font-mono text-xs font-bold mt-0">
    <span class="text-gray-400 ps-1">unwild.email</span>
    &gt;
    <a href="#/mails" class="font-bold text-gray-700 border-b border-gray-200 hover:border-gray-700 hover:border-b-2">Emails</a>
  </div>

  <!-- Fixed page toolbar -->
  <div class="shrink-0 flex items-center mt-4 px-0 pe-4 py-0 rounded-md gap-0.5">
    <button class="btn btn-xs p-4 bg-white rounded-md hover:bg-gray-800 hover:text-white">Vista básica</button>
    <button class="btn btn-xs p-4 bg-white rounded-md hover:bg-gray-800 hover:text-white">Todas</button>

    <div class="dropdown dropdown-end">
      <button tabindex="0" aria-label="More" class="btn btn-xs p-4 px-2 bg-white rounded-md hover:bg-gray-800 hover:text-white">
        <MoreVertical class="size-4" />
      </button>
      <ul class="dropdown-content menu bg-base-100 rounded-md border border-base-300 z-10 w-40 p-1 shadow">
        <li><a>Action 1</a></li>
        <li><a>Action 2</a></li>
        <li><a>Action 3</a></li>
      </ul>
    </div>

    <div class="flex-1"></div>
    <button class="btn btn-xs btn-ghost" onclick={ping}>Ping</button>
  </div>

  <!-- Scrollable content -->
  <div class="flex-1 min-h-0 overflow-auto mt-0.5 p-0 --bg-base-100 --border border-base-300 rounded-md">
    <div>
      <h1 class="text-2xl font-semibold">Mails</h1>
      <p class="text-base-content/60">Grouped email view placeholder. status={status} {errMsg}</p>
      {#if payload}<pre class="text-xs">{JSON.stringify(payload)}</pre>{/if}
    </div>

    <div class="my-2">Algo .... </div>
    <div class="my-2">Algo .... </div>
    <div class="my-2">Algo .... </div>
    <div class="my-2">Algo .... </div>
    <div class="my-2">Algo .... </div>
    <div class="my-2">Algo .... </div>
    <div class="my-2">Algo .... </div>
    <div class="my-2">Algo .... </div>
    <div class="my-2">Algo .... </div>
    <div class="my-2">Algo .... </div>
    <div class="my-2">Algo .... </div>
    <div class="my-2">Algo .... </div>
    <div class="my-2">Algo .... </div>
    <div class="my-2">Algo .... </div>
    <div class="my-2">Algo .... </div>
    <div class="my-2">Algo .... </div>
    <div class="my-2">Algo .... </div>
    <div class="my-2">Algo .... </div>
    <div class="my-2">Algo .... </div>
    <div class="my-2">Algo .... </div>
    <div class="my-2">Algo .... </div>
    <div class="my-2">Algo .... </div>
    <div class="my-2">Algo .... </div>
    <div class="my-2">Algo .... </div>
    <div class="my-2">Algo .... </div>
    <div class="my-2">Algo .... </div>
    <div class="my-2">Algo .... </div>
    <div class="my-2">Algo .... </div>
    <div class="my-2">Algo .... </div>
    <div class="my-2">Algo .... </div>
    <div class="my-2">Algo .... </div>
    <div class="my-2">Algo 200.... </div>
  </div>

  <FloatingSearch />
</div>
