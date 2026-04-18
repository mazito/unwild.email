// Exhaustive-ish branching on tagged variants.

export interface Tagged {
  tag: string
}

export function match<V extends Tagged, R>(variant: V, cases: Record<string, (v: V) => R>): R {
  const handler = cases[variant.tag]
  if (!handler) throw new Error(`unhandled variant: ${variant.tag}`)
  return handler(variant)
}
