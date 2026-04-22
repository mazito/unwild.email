<script lang="ts">
  import { ChevronDown, Link, Maximize2, Minimize2, Paperclip, X } from 'lucide-svelte'

  interface Props {
    onClose: () => void
  }
  let { onClose }: Props = $props()

  let body = $state('')
  let maximized = $state(false)
  let rootEl: HTMLDivElement | undefined
  let bodyEl: HTMLTextAreaElement | undefined

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  function doSend() {
    alert('Send now (noop)')
  }

  function doDraft() {
    alert('Saved as draft (noop)')
  }

  function todo(what: string) {
    alert(`TODO: ${what}`)
  }

  $effect(() => {
    if (bodyEl && document.activeElement !== bodyEl) bodyEl.focus()
  })
</script>

<div
  bind:this={rootEl}
  class={
    'rounded-sm border border-base-300 bg-base-100 shadow-lg flex flex-col overflow-hidden ' +
    (maximized
      ? 'w-[calc(100vw-8rem)]'
      : 'w-[34rem] max-w-[calc(100vw-2rem)]')
  }
  style={
    maximized
      ? 'max-height: calc(100vh - 5.25rem); height: calc(100vh - 5.25rem);'
      : 'max-height: calc(100vh - 5.25rem);'
  }
  onkeydown={onKeydown}
  role="dialog"
  aria-label="Compose email"
  tabindex="-1"
>
  <!-- Top toolbar: left = formatter slot (empty for now), right = expand/close -->
  <div class="py-1 ps-4 pe-1 flex items-center justify-between gap-2 --border-b">
    <div class="flex items-center gap-1 text-base-content/40 text-xs">
      <!-- formatter placeholder -->
    </div>
    <div class="flex items-center gap-0.5">
      <button
        type="button"
        aria-label={maximized ? 'Restore size' : 'Expand'}
        title={maximized ? 'Restore' : 'Expand'}
        class="p-2 rounded-sm text-base-content/60 hover:text-base-content hover:bg-base-200"
        onclick={() => (maximized = !maximized)}
      >
        {#if maximized}
          <Minimize2 class="size-4" />
        {:else}
          <Maximize2 class="size-4" />
        {/if}
      </button>
      <button
        type="button"
        aria-label="Close compose"
        title="Close"
        class="p-2 rounded-sm text-base-content/60 hover:text-base-content hover:bg-base-200"
        onclick={onClose}
      >
        <X class="size-4" />
      </button>
    </div>
  </div>

  <!-- Body area: full-width textarea -->
  <div class="flex-1 min-h-0 flex">
    <textarea
      bind:this={bodyEl}
      bind:value={body}
      placeholder="Write your email… (first line is the subject)"
      class="flex-1 min-w-0 block w-full p-3 bg-transparent border-0 outline-none resize-none focus:outline-none text-sm leading-6"
      style={maximized ? '' : 'field-sizing: content; min-height: 6rem; max-height: calc(100vh - 14rem);'}
    ></textarea>
  </div>

  <!-- Bottom action row -->
  <div class="border-t border-base-300 ps-4 pe-6 py-3 flex items-center justify-between gap-2">
    <!-- Left: attach, link (icon-only) -->
    <div class="flex items-center gap-1">
      <button
        type="button"
        aria-label="Attach file"
        title="Attach file"
        class="btn btn-sm btn-ghost px-2"
        onclick={() => todo('Attach file')}
      >
        <Paperclip class="size-4" />
      </button>
      <button
        type="button"
        aria-label="Insert link"
        title="Insert link"
        class="btn btn-sm btn-ghost px-2"
        onclick={() => todo('Insert link')}
      >
        <Link class="size-4" />
      </button>
    </div>

    <!-- Right: To, Cc, Send dropdown -->
    <div class="flex items-center gap-1">
      <button
        type="button"
        class="btn btn-sm btn-ghost px-2"
        onclick={() => todo('To recipients')}
        >
        To
      </button>
      <button
        type="button"
        class="btn btn-sm btn-ghost px-2"
        onclick={() => todo('Cc recipients')}
        >
        Cc
      </button>
      <button
        type="button"
        class="btn btn-sm btn-ghost px-2"
        onclick={() => todo('Cco recipients')}
        >
        Cco
      </button>

      <div class="dropdown dropdown-top dropdown-end ms-2">
        <div tabindex="0" role="button" class="btn btn-sm btn-neutral bg-black text-white border-0 px-2 gap-1">
          Send
          <ChevronDown class="size-3" />
        </div>
        <ul class="dropdown-content menu bg-base-100 rounded-md border border-base-300 z-20 w-40 p-1 shadow mb-1">
          <li><button type="button" onclick={doSend}>Send now</button></li>
          <li><button type="button" onclick={doDraft}>Save as draft</button></li>
        </ul>
      </div>
    </div>
  </div>
</div>
