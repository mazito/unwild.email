<script lang="ts">
  import { LogOut, Menu, MessageCircleQuestionMark, Plus, Search, UserCog, MailPlus, Sparkles } from 'lucide-svelte'
  import { avatarSVG } from '../lib/avatar.ts'
  import { hrefFor } from '../lib/router.ts'

  interface Props {
    userAlias?: string
  }
  let { userAlias = 'Anibal Zito' }: Props = $props()

  let searchValue = $state('')
  const identicon = $derived(avatarSVG(userAlias, 52))
</script>

<header class="min-h-[var(--header-h)] ps-4 pt-1 pb-1 flex items-start justify-between --border">
  <div class="flex-none lg:hidden">
    <label for="sidebar-drawer" aria-label="open sidebar" class="btn btn-square btn-ghost btn-sm">
      <Menu class="size-5" />
    </label>
  </div>

  <div class="flex-none py-1">
    <div class="text-2xl text-indigo-900 font-mono font-bold">
      <img src="./myown-logo.svg" alt="My Own Logo" class="w-auto h-[48px]" />
    </div>
  </div>

  <div class="flex justify-center items-center rounded-md p-0 m-0 mt-2 --border border-gray-100">
      <div class={
          "bg-white flex items-center justify-start ps-4 border border-gray-300 rounded-md h-10 w-80 pe-1 me-0.5"+
          " hover:bg-gray-300"
        }>
        <!--input-baseinput-bordered flex items-center gap-2 w-full max-w-lg py-0 h-12 rounded-md"-->
        <Search class="size-4 me-3" />
        <input type="search" placeholder="Search…" bind:value={searchValue}
          class={"text-base grow py-1 px-2 rounded-md"+" focus:bg-white hover:bg-white"}
        />
      </div>

      <div class="dropdown dropdown-end">
        <a
          href={hrefFor('compose')}
          class={
            "h-10 w-12 flex items-center justify-center rounded-md bg-white border border-gray-300"+
            " hover:bg-gray-300"
          }
          aria-label="New ..."
          title="New ..."
          tabindex="0"
          role="button"
          >
          <Plus class="size-6 text-gray-600" />
        </a>
        <ul class="menu menu-md dropdown-content bg-base-100 rounded-box z-50 mt-3 w-42 p-1 shadow border border-base-300 pb-2">
          <li class="">
            <a href={hrefFor('profile')}>
              <MailPlus class="size-4 opacity-60 me-1" />
              Compose <br/>Email
            </a>
          </li>
          <hr class="my-2 border-base-300" />
          <li>
            <a href={hrefFor('profile')}>
              <Plus class="size-4 opacity-60 me-1" />
              People
            </a>
          </li>
          <li>
            <a href={hrefFor('profile')}>
              <Plus class="size-4 opacity-60 me-1" />
              Organizations
            </a>
          </li>
        </ul>
      </div>
  </div>

  <div class="flex items-center justify-end">
    <div class="dropdown dropdown-end me-2">
      <div
        tabindex="0"
        role="button"
        class="btn btn-ghost btn-circle size-11 p-0 overflow-hidden border-0"
        title={userAlias}
        aria-label="Open profile menu"
        >
        {@html identicon}
      </div>
      <ul class="menu dropdown-content bg-base-100 rounded-box z-50 mt-3 w-46 p-1 shadow border border-base-300">
        <li class="menu-title px-3 py-2 --border-b border-base-300 mb-1">
          <div class="text-sm font-semibold text-base-content">{userAlias}</div>
          <div class="text-xs opacity-60">signed in</div>
        </li>
        <li>
          <a href={hrefFor('profile')}>
            <UserCog class="size-4 opacity-70" />
            Profile &amp; prefs
          </a>
        </li>
        <hr class="my-2 border-base-300" />
        <li>
          <button type="button" class="--text-error">
            <LogOut class="size-4" />
            Logout
          </button>
        </li>
      </ul>
    </div>

    <a href={"#"}
      class={
        "bg-white h-9 w-10 flex items-center justify-center border-l border-gray-300 rounded-l-md ps-1"+
        "  border border-gray-300 hover:bg-gray-300"
      }
      aria-label="Ask me"
      title="Ask me"
      >
      <Sparkles class="size-5 text-orange-600" />
    </a>
  </div>
</header>
