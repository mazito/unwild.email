<script lang="ts">
  import AppHeader from './components/AppHeader.svelte'
  import { route } from './router.svelte.ts'
  import TodoPage from './pages/TodoPage.svelte'
  import WaitingPage from './pages/WaitingPage.svelte'
  import ProtectedPage from './pages/ProtectedPage.svelte'
  import AccountPage from './pages/AccountPage.svelte'
</script>

<div class="min-h-screen bg-uw-bg flex flex-col">
  <AppHeader />
  <main class="flex-1">
    {#if route.current.tag === 'todo'}
      <TodoPage />
    {:else if route.current.tag === 'waiting'}
      <WaitingPage />
    {:else if route.current.tag === 'protected'}
      <ProtectedPage />
    {:else if route.current.tag === 'account'}
      <AccountPage />
    {:else}
      <div class="flex min-h-[50vh] items-center justify-center text-uw-muted">
        Not found: /{route.current.path}
      </div>
    {/if}
  </main>
</div>
