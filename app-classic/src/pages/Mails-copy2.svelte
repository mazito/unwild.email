<script lang="ts">
  import { MoreVertical } from 'lucide-svelte'
  import BottomDock from '../components/BottomDock.svelte'
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

<div class="relative h-full w-full">
  <div>
  <!-- Scrollable content -->
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
</div>

<BottomDock />
