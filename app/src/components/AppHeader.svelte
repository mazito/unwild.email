<script lang="ts">
  import { Sprout } from 'lucide-svelte'
  import { route, hrefFor } from '../router.svelte.ts'

  function isActive(tag: string) {
    return route.current.tag === tag
  }
</script>

<header class="flex items-center justify-between px-6 py-3">
  <!-- Logo -->
  <a href={hrefFor('todo')} class="flex items-center gap-0.5 select-none">
    <Sprout class="size-5 text-emerald-600 -mt-1" stroke-width={2.5} />
    <div class="flex flex-col leading-none">
      <span class="text-base font-bold tracking-tight text-uw-text">nwild</span>
      <span class="text-[10px] font-medium text-uw-muted">your email</span>
    </div>
  </a>

  <!-- Nav -->
  <nav class="flex items-center gap-6">
    <a href={hrefFor('todo')} class="text-sm font-medium underline-offset-4 {isActive('todo') ? 'underline' : 'hover:underline'}">
      Todo
    </a>
    <a href={hrefFor('waiting')} class="text-sm font-medium underline-offset-4 {isActive('waiting') ? 'underline' : 'hover:underline'}">
      Waiting…
    </a>
    <a href={hrefFor('protected')} class="text-sm font-medium underline-offset-4 {isActive('protected') ? 'underline' : 'hover:underline'}">
      Protected.
    </a>
  </nav>

  <!-- Avatar -->
  <a href={hrefFor('account')} class="shrink-0" aria-label="Account">
    <div class="size-9 rounded-full bg-gradient-to-br from-blue-400 to-orange-400 ring-2 ring-white ring-offset-2 ring-offset-uw-bg"></div>
  </a>
</header>
