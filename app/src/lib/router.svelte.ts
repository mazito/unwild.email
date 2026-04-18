// Effect shell: wires window.location.hash into a reactive rune state.

import { type Route, parseHash } from './router.ts'

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
