<script lang="ts">
  interface Props { path: string }
  let { path }: Props = $props()
</script>

<div class="hero">
  <div class="hero-content text-center">
    <div class="max-w-md">
      <h1 class="text-5xl font-bold">404</h1>
      <p class="py-4">No route for <code class="kbd kbd-sm">{path}</code>.</p>
      <a href="#/" class="btn btn-primary btn-sm">← Home</a>
    </div>
  </div>
</div>
