<script lang="ts">
  import Header from './components/Header.svelte'
  import Sidebar from './components/Sidebar.svelte'
  import { route } from './router.svelte.ts'
  import Admin from './pages/Admin.svelte'
  import Compose from './pages/Compose.svelte'
  import Contacts from './pages/Contacts.svelte'
  import Documents from './pages/Documents.svelte'
  import Home from './pages/Home.svelte'
  import Mails from './pages/Mails.svelte'
  import Monitor from './pages/Monitor.svelte'
  import NotFound from './pages/NotFound.svelte'
  import Profile from './pages/Profile.svelte'
</script>

<div class="drawer lg:drawer-open min-h-screen">
  <input id="sidebar-drawer" type="checkbox" class="drawer-toggle" />

  <div class="drawer-content flex flex-col">
    <Header />

    <div class="font-mono text-xs font-bold -mt-1 ms-4">
      <span class="text-gray-400 ps-1">unwild.email</span>
      &gt;
      <a href="#/" class="font-bold text-gray-700 border-b border-gray-200 hover:border-gray-700 hover:border-b-2">Emails</a>
    </div>

    <main class="flex-1 overflow-auto p-4 md:p-6">
      {#if route.current.tag === 'home'}
        <Home />
      {:else if route.current.tag === 'mails'}
        <Mails />
      {:else if route.current.tag === 'compose'}
        <Compose />
      {:else if route.current.tag === 'contacts'}
        <Contacts />
      {:else if route.current.tag === 'documents'}
        <Documents />
      {:else if route.current.tag === 'profile'}
        <Profile />
      {:else if route.current.tag === 'admin'}
        <Admin />
      {:else if route.current.tag === 'monitor'}
        <Monitor />
      {:else}
        <NotFound path={route.current.path} />
      {/if}
    </main>
  </div>

  <div class="drawer-side z-40">
    <label for="sidebar-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
    <Sidebar />
  </div>
</div>
