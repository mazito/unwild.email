<script lang="ts">
  import type { Component } from 'svelte'
  import { BookText, Gauge, Rocket, Activity, SlidersHorizontal, Users, Mails } from 'lucide-svelte'
  import { hrefFor, type Route } from '../lib/router.ts'
  import { route } from '../lib/router.svelte.ts'

  interface Item {
    tag: Exclude<Route['tag'], 'notfound'>
    label: string
    icon: Component
    admin?: boolean
  }

  const items: Item[] = [
    { tag: 'home', label: 'Mails', icon: Mails },
    { tag: 'documents', label: 'Documents & Files', icon: BookText },
    { tag: 'contacts', label: 'Persons & Orgs', icon: Users },
    { tag: 'profile', label: 'Advanced Options', icon: Rocket },
    { tag: 'admin', label: 'Administration & Settings', icon: SlidersHorizontal, admin: true },
    { tag: 'monitor', label: 'Health & Status', icon: Activity, admin: true },
  ]

  function isActive(tag: string): boolean {
    return route.current.tag === tag
  }
</script>

<aside class="bg-base-100 border-r border-base-300 min-h-full w-60 lg:w-16 flex flex-col">
  <a
    href={hrefFor('home')}
    class="flex items-center justify-center py-3"
    aria-label="unwild.email home"
    >
    <img src="./unwild-logo.svg" alt="unwild.email" class="h-10 w-auto" />
  </a>
  <hr class="my-1 border-gray-400 mx-3" />

  <ul class="p-0 m-0 mt-2">
    {#each items as it, i (it.tag)}
      {#if it.admin && i > 0 && !items[i - 1]?.admin}
        <li class="menu-title">
          <hr class="my-1 border-gray-400" />
        </li>
      {/if}
      <li class="m-0 p-0 w-full text-center hover:bg-gray-200">
        <a
          href={hrefFor(it.tag)}
          title={it.label}
          class={"inline-block"}
          >
          <it.icon class="size-6.75 text-gray-700 my-3 mx-2" />
        </a>
      </li>
    {/each}
  </ul>
</aside>
