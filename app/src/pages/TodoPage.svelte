<script lang="ts">
  import SectionHeader from '../components/SectionHeader.svelte'
  import SenderBlock from '../components/SenderBlock.svelte'

  // --- Mock data -----------------------------------------------------------
  const newSenders = [
    {
      name: 'Mariana Capdeville',
      initials: 'MC',
      color: '#F4A261',
      threads: [
        { dir: 'in' as const, subject: 'Reunion avance Q90 - Ya quedo agendada para el Martes proximo', time: '9:07' },
        { dir: 're' as const, subject: 'Reunion avance Q90 - Confirmado 9hs', time: '10:15' },
      ],
    },
  ]

  const doneSenders = [
    {
      name: 'Honorio Martini',
      initials: 'HM',
      color: '#E63946',
      threads: [
        { dir: 'in' as const, subject: 'Reunion avance Q90 - Ya quedo agendada para el Martes proximo', time: '9:07' },
        { dir: 're' as const, subject: 'Reunion avance Q90 - Confirmado 9hs', time: '10:15' },
      ],
    },
    {
      name: 'Juan Perezito',
      initials: 'JP',
      color: '#2A9D8F',
      threads: [
        { dir: 'in' as const, subject: 'Reunion avance Q90 - Ya quedo agendada para el Martes proximo', time: '9:07' },
      ],
    },
  ]
</script>

<div class="flex flex-col items-center pt-4 pb-8">
  <h1 class="text-2xl font-serif font-bold text-uw-text mb-4">Todo</h1>

  <div class="w-full max-w-2xl bg-uw-card rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <SectionHeader title="New (todo)" action="Grouped by" />
    {#each newSenders as s (s.name)}
      <SenderBlock name={s.name} initials={s.initials} color={s.color} threads={s.threads} />
    {/each}

    <SectionHeader title="Done" action="Ordered by" />
    {#each doneSenders as s (s.name)}
      <SenderBlock name={s.name} initials={s.initials} color={s.color} threads={s.threads} />
    {/each}
  </div>
</div>
