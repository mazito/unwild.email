// Immutable state container with named transitions.

export type Subscriber<S> = (state: S, prev: S) => void

export interface Store<S> {
  getState: () => S
  transition: (name: string, fn: (state: S) => S) => S
  subscribe: (fn: Subscriber<S>) => () => void
}

export function createStore<S>(initialState: S): Store<S> {
  let state = initialState
  const subscribers = new Set<Subscriber<S>>()

  return {
    getState: () => state,
    transition(name, fn) {
      const prev = state
      const next = fn(state)
      if (next === prev) return state
      state = next
      // Traceability: every state change is named.
      console.debug('state:', name, { prev, next })
      for (const sub of subscribers) sub(state, prev)
      return state
    },
    subscribe(fn) {
      subscribers.add(fn)
      return () => {
        subscribers.delete(fn)
      }
    },
  }
}
