<script lang="ts">
  import { LogOut, Menu, MessageCircleQuestionMark, Plus, Search, UserCog, MailPlus, Sparkles } from 'lucide-svelte'
  import { avatarSVG } from '../lib/avatar.ts'
  import { hrefFor } from '../router.svelte.ts'

  interface Props {
    userAlias?: string
  }
  let { userAlias = 'Anibal Zito' }: Props = $props()

  let searchValue = $state('')
  const identicon = $derived(avatarSVG(userAlias, 52))
</script>

<header class="min-h-[var(--header-h)] px-4 pt-1 pb-1 flex items-center justify-between --border-b --bg-white">
  <div class="flex-none lg:hidden">
    <label for="sidebar-drawer" aria-label="open sidebar" class="btn btn-square btn-ghost btn-sm">
      <Menu class="size-5" />
    </label>
  </div>

  <div class="flex-none">
    <div class="text-lg text-gray-900 font-mono font-bold">
      <span>Biz/Family</span>
      <!-- <img src="./myown-logo.svg" alt="My Own Logo" class="w-auto h-[48px]" /> -->
    </div>
  </div>

  <div class="flex items-center justify-end">
    <div class="dropdown dropdown-end">
      <div
        tabindex="0"
        role="button"
        class="btn btn-ghost btn-circle size-9 overflow-hidden border-0"
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

    <!-- <a href={"#"}
      class={
        "bg-white h-9 w-10 flex items-center justify-center border-l border-gray-300 rounded-l-md ps-1"+
        "  border border-gray-300 hover:bg-gray-300"
      }
      aria-label="Ask me"
      title="Ask me"
      >
      <Sparkles class="size-5 text-orange-600" />
    </a> -->
  </div>
</header>
