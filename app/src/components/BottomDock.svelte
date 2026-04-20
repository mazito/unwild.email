<script lang="ts">
  import ComposeButton from './ComposeButton.svelte'
  import ComposePanel from './ComposePanel.svelte'
  import FloatingSearch from './FloatingSearch.svelte'

  let mode = $state<'search' | 'compose'>('search')
  let searchExpanded = $state(false)

  function openCompose() {
    mode = 'compose'
  }

  function closeCompose() {
    mode = 'search'
  }
</script>

<div class="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 z-20">
  {#if mode === 'search'}
    <FloatingSearch onFocusChange={(e) => (searchExpanded = e)} />
    <ComposeButton hidden={searchExpanded} onclick={openCompose} />
  {:else}
    <ComposePanel onClose={closeCompose} />
  {/if}
</div>
