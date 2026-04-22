export type Route =
  | { tag: 'todo' }
  | { tag: 'waiting' }
  | { tag: 'protected' }
  | { tag: 'account' }
  | { tag: 'notfound'; path: string }

export function parseHash(hash: string): Route {
  const clean = hash.replace(/^#\/?/, '').split('?')[0] ?? ''
  switch (clean) {
    case '':
    case 'todo': return { tag: 'todo' }
    case 'waiting': return { tag: 'waiting' }
    case 'protected': return { tag: 'protected' }
    case 'account': return { tag: 'account' }
    default: return { tag: 'notfound', path: clean }
  }
}

export function hrefFor(tag: Exclude<Route['tag'], 'notfound'>): string {
  return `#/${tag === 'todo' ? '' : tag}`
}

function getInitial(): Route {
  if (typeof window === 'undefined') return { tag: 'todo' }
  return parseHash(window.location.hash)
}

export const route = $state<{ current: Route }>({ current: getInitial() })

if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    route.current = parseHash(window.location.hash)
  })
}
