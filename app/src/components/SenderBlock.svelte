<script lang="ts">
  interface ThreadLine {
    dir: 'in' | 're'
    subject: string
    time: string
  }

  interface Props {
    name: string
    initials: string
    color: string
    threads: ThreadLine[]
  }

  const { name, initials, color, threads }: Props = $props()

  function dirLabel(d: 'in' | 're') {
    return d === 'in' ? 'In :>' : 'Re <:'
  }
</script>

<div class="flex items-stretch gap-3 px-4 py-3">
  <div class="flex flex-col items-center pt-0.5">
    <div class="size-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style="background-color: {color}">
      {initials}
    </div>
  </div>
  <div class="flex-1 min-w-0">
    <div class="text-sm font-semibold text-uw-text">{name}</div>
    <div class="mt-1.5 flex flex-col gap-1">
      {#each threads as t (t.subject + t.time)}
        <div class="flex items-baseline justify-between gap-3 text-sm">
          <span class="truncate text-uw-muted">
            <span class="font-medium text-uw-text">{dirLabel(t.dir)}</span>
            {t.subject}
          </span>
          <span class="shrink-0 text-xs text-uw-muted tabular-nums">{t.time}</span>
        </div>
      {/each}
    </div>
  </div>
</div>
