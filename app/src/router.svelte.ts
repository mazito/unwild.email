// ---------------------------------------------------------------------------
// Hash router (single file, lives next to App.svelte).
//
// How it works:
//   - URL fragment (`window.location.hash`) is the source of truth, e.g.
//         https://app.example/#/             -> { tag: 'home' }    (root)
//         https://app.example/#/mails        -> { tag: 'mails' }
//         https://app.example/#/contacts     -> { tag: 'contacts' }
//         https://app.example/#/whatever     -> { tag: 'notfound', path: 'whatever' }
//   - `parseHash()` turns the raw hash string into a typed `Route`.
//   - `route` is a Svelte 5 rune-backed store. App.svelte reads `route.current`.
//   - A single `hashchange` listener keeps `route.current` in sync with the URL.
//   - `hrefFor(tag)` builds the `#/…` string used in <a href>.
//
// To add a new page:
//   1. add a tag to the `Route` union
//   2. add a case in `parseHash`
//   3. render it in App.svelte
//   4. (optional) add a Sidebar entry
// ---------------------------------------------------------------------------

export type Route =
  | { tag: 'home' }
  | { tag: 'mails' }
  | { tag: 'contacts' }
  | { tag: 'documents' }
  | { tag: 'compose' }
  | { tag: 'profile' }
  | { tag: 'admin' }
  | { tag: 'monitor' }
  | { tag: 'notfound'; path: string }

// Root (`#/` or empty) goes to Home. `#/mails` goes to the Mails page.
export function parseHash(hash: string): Route {
  const clean = hash.replace(/^#\/?/, '').split('?')[0] ?? ''
  switch (clean) {
    case '':
    case 'home': return { tag: 'home' }
    case 'mails': return { tag: 'mails' }
    case 'contacts': return { tag: 'contacts' }
    case 'documents': return { tag: 'documents' }
    case 'compose': return { tag: 'compose' }
    case 'profile': return { tag: 'profile' }
    case 'admin': return { tag: 'admin' }
    case 'monitor': return { tag: 'monitor' }
    default: return { tag: 'notfound', path: clean }
  }
}

export function hrefFor(tag: Exclude<Route['tag'], 'notfound'>): string {
  // Home is the root; everything else (including Mails) is `#/<tag>`.
  return `#/${tag === 'home' ? '' : tag}`
}

// --- Reactive store -------------------------------------------------------

function getInitial(): Route {
  if (typeof window === 'undefined') return { tag: 'home' }
  return parseHash(window.location.hash)
}

export const route = $state<{ current: Route }>({ current: getInitial() })

if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    route.current = parseHash(window.location.hash)
  })
}
