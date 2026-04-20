<script lang="ts">
  import { Search, Send, X } from 'lucide-svelte'

  let focused = $state(false)
  let value = $state('')
  let results = $state<string[]>([])
  let committedWords = $state(0) // how many full words already reflected in results (search mode)
  let rootEl: HTMLDivElement | undefined
  let inputEl: HTMLInputElement | undefined
  let textareaEl: HTMLTextAreaElement | undefined

  const expanded = $derived(focused || value.length > 0 || results.length > 0)

  // Ask mode: first token is exactly "/ask" (followed by space or EOL)
  const askMode = $derived(/^\s*\/ask(\s|$)/.test(value))

  const SIM_PARA =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit.\nSed do eiusmod tempor incididunt ut labore et dolore magna.'

  function countFullWords(s: string): number {
    // A "full word" is a token followed by whitespace (so last token is only counted if the user typed a trailing space).
    const trimmedStart = s.replace(/^\s+/, '')
    if (trimmedStart.length === 0) return 0
    const tokens = trimmedStart.split(/\s+/)
    const endsWithSpace = /\s$/.test(s)
    return endsWithSpace ? tokens.length : tokens.length - 1
  }

  function onInput(e: Event) {
    const t = e.target as HTMLInputElement | HTMLTextAreaElement
    value = t.value

    if (value.length === 0) {
      results = []
      committedWords = 0
      return
    }

    // In ask mode we don't show results on input; only on submit.
    if (askMode) return

    const full = countFullWords(value)
    if (full > committedWords) {
      const add = full - committedWords
      const batch: string[] = []
      for (let i = 0; i < add; i++) batch.push(SIM_PARA)
      results = [...results, ...batch]
      committedWords = full
    } else if (full < committedWords) {
      // User deleted chars → keep results but resync counter
      committedWords = full
    }
  }

  function clearInput() {
    value = ''
    results = []
    committedWords = 0
    if (textareaEl) textareaEl.focus()
    else if (inputEl) inputEl.focus()
  }

  function submit() {
    if (value.trim().length === 0) return
    if (askMode) {
      const q = value.replace(/^\s*\/ask\s*/, '')
      results = [...results, `ASK: ${q || '(empty)'}`, SIM_PARA]
      // keep value so user sees what was asked; reset word counter
      return
    }
    alert(`Search (noop): "${value}"`)
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      value = ''
      results = []
      committedWords = 0
      ;(e.target as HTMLElement).blur()
      focused = false
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  function onDocClick(e: MouseEvent) {
    if (!rootEl) return
    if (!rootEl.contains(e.target as Node)) {
      focused = false
      value = ''
      results = []
      committedWords = 0
    }
  }

  $effect(() => {
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  })

  // When the pill expands, move focus+caret to the textarea so the user keeps typing seamlessly.
  $effect(() => {
    if (expanded && focused && textareaEl && document.activeElement !== textareaEl) {
      textareaEl.focus()
      const n = textareaEl.value.length
      textareaEl.setSelectionRange(n, n)
    }
  })
</script>

<div
  bind:this={rootEl}
  class="
    absolute bottom-6 left-1/2 -translate-x-1/2 w-[34rem] max-w-[calc(100vw-2rem)]
    rounded-sm border border-base-300 bg-base-100 shadow-lg flex flex-col overflow-hidden z-20
    ps-2
  "
  style="max-height: calc(100vh - 6rem);"
>
  {#if !expanded}
    <!-- Collapsed: single-row pill -->
    <div class="flex items-center h-10">
      <input
        bind:this={inputEl}
        type="text"
        placeholder="Search or /ask …"
        class="flex-1 h-full px-3 text-sm bg-transparent border-0 outline-none focus:outline-none"
        onfocus={() => (focused = true)}
        oninput={onInput}
        onkeydown={onKeydown}
        value={value}
      />
      {#if value.length > 0}
        <button
          type="button"
          aria-label="Clear"
          class="h-full px-2 border-0 bg-transparent text-base-content/50 hover:text-base-content"
          onclick={clearInput}
        >
          <X class="size-4" />
        </button>
      {/if}
      <button
        type="button"
        aria-label={askMode ? 'Send' : 'Search'}
        class="h-full px-3 border-0 bg-transparent hover:bg-base-300"
        onclick={submit}
      >
        {#if askMode}
          <Send class="size-4" />
        {:else}
          <Search class="size-4" />
        {/if}
      </button>
    </div>
  {:else}
    <!-- Expanded: results (top, grows) + input area (bottom) -->
    <div class="flex-1 min-h-0 overflow-y-auto p-3 text-sm">
      {#if results.length === 0}
        <p class="text-base-content/50">No results yet. Type to search or /ask the AI.</p>
      {:else}
        {#each results as r, i (i)}
          <p class="mb-2 whitespace-pre-line">{r}</p>
        {/each}
      {/if}
    </div>

    <div class="border-t border-base-300 p-2 flex items-start gap-1">
      <textarea
        bind:this={textareaEl}
        rows="1"
        placeholder="Search or /ask …"
        class="flex-1 min-w-0 block bg-transparent border-0 outline-none resize-none focus:outline-none text-sm leading-6 px-1"
        style="field-sizing: content; max-height: 7.5rem;"
        onfocus={() => (focused = true)}
        oninput={onInput}
        onkeydown={onKeydown}
        value={value}
      ></textarea>
      <div class="shrink-0 flex items-start">
        {#if value.length > 0}
          <button
            type="button"
            aria-label="Clear"
            class="p-1.5 border-0 bg-transparent text-base-content/50 hover:text-base-content rounded-sm"
            onclick={clearInput}
          >
            <X class="size-4" />
          </button>
        {/if}
        <button
          type="button"
          aria-label={askMode ? 'Send' : 'Search'}
          class="p-1.5 border-0 bg-transparent hover:bg-base-200 rounded-sm"
          onclick={submit}
        >
          {#if askMode}
            <Send class="size-4" />
          {:else}
            <Search class="size-4" />
          {/if}
        </button>
      </div>
    </div>
  {/if}
</div>
