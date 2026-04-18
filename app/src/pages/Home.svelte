<script lang="ts">
  import { hrefFor } from '../router.svelte.ts'
</script>

<section class="max-w-3xl">
  <h1 class="text-2xl font-bold mb-2">Welcome to unwild.email</h1>
  <p class="text-gray-600 mb-6">
    Your local-first, entity-first email engine. Pick where to go:
  </p>

  <ul class="grid gap-3 sm:grid-cols-2">
    <li>
      <a href={hrefFor('mails')} class="block border rounded-lg p-4 hover:bg-gray-50">
        <div class="font-semibold">Mails</div>
        <div class="text-sm text-gray-500">Browse your messages.</div>
      </a>
    </li>
    <li>
      <a href={hrefFor('contacts')} class="block border rounded-lg p-4 hover:bg-gray-50">
        <div class="font-semibold">Persons &amp; Orgs</div>
        <div class="text-sm text-gray-500">People and organizations.</div>
      </a>
    </li>
    <li>
      <a href={hrefFor('documents')} class="block border rounded-lg p-4 hover:bg-gray-50">
        <div class="font-semibold">Documents &amp; Files</div>
        <div class="text-sm text-gray-500">Attachments and files.</div>
      </a>
    </li>
    <li>
      <a href={hrefFor('admin')} class="block border rounded-lg p-4 hover:bg-gray-50">
        <div class="font-semibold">Administration</div>
        <div class="text-sm text-gray-500">Accounts and settings.</div>
      </a>
    </li>
  </ul>
</section>
