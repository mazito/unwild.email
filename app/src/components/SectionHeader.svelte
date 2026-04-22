<script lang="ts">
  import { LayoutGrid } from 'lucide-svelte'

  interface Props {
    title: string
    action: string
  }

  const { title, action }: Props = $props()
</script>

<div class="flex items-center gap-3 px-4 pt-4 pb-1">
  <h2 class="text-sm font-bold uppercase tracking-wide text-uw-text">{title}</h2>
  <div class="flex-1 h-px bg-uw-line"></div>
  <button class="btn btn-ghost btn-xs gap-1 text-xs text-uw-muted">
    <LayoutGrid class="size-3" />
    {action}
  </button>
</div>
