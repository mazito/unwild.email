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

<div class="drawer lg:drawer-open h-screen overflow-hidden">
  <input id="sidebar-drawer" type="checkbox" class="drawer-toggle" />

  <div class="drawer-content flex flex-col h-screen overflow-hidden">
    <Header />

    <!-- Page panel: fills remaining viewport; pages own their toolbar + scroll area -->
    <main class="flex-1 min-h-0 mt-0 md:mx-2 --border --border-dashed">
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
