// Pure-ish hash router. Exposes a Svelte 5 rune-backed `current` route.

export type Route =
  | { tag: 'home' }
  | { tag: 'contacts' }
  | { tag: 'documents' }
  | { tag: 'compose' }
  | { tag: 'profile' }
  | { tag: 'admin' }
  | { tag: 'monitor' }
  | { tag: 'notfound'; path: string }

export function parseHash(hash: string): Route {
  const clean = hash.replace(/^#\/?/, '').split('?')[0] ?? ''
  switch (clean) {
    case '':
    case 'home':
      return { tag: 'home' }
    case 'contacts':
      return { tag: 'contacts' }
    case 'documents':
      return { tag: 'documents' }
    case 'compose':
      return { tag: 'compose' }
    case 'profile':
      return { tag: 'profile' }
    case 'admin':
      return { tag: 'admin' }
    case 'monitor':
      return { tag: 'monitor' }
    default:
      return { tag: 'notfound', path: clean }
  }
}

export function hrefFor(tag: Exclude<Route['tag'], 'notfound'>): string {
  return `#/${tag === 'home' ? '' : tag}`
}
