<script lang="ts">
  import { MailPlus } from 'lucide-svelte'

  interface Props {
    onclick?: () => void
    hidden?: boolean
  }
  let { onclick, hidden = false }: Props = $props()
</script>

<button
  type="button"
  aria-label="Compose email"
  title="Compose email"
  class={
    "h-10 w-10 flex items-center justify-center rounded-sm bg-white border border-gray-300 "+
    "hover:bg-gray-800 hover:text-white transition-opacity " +
    (hidden ? 'invisible pointer-events-none' : '')
  }
  onclick={onclick}
  >
  <MailPlus class="size-5" />
</button>
