const byEmail = new Map<string, string>()
const listeners = new Set<() => void>()

const key = (email: string) => email.trim().toLowerCase()

/** Hear about new pictures, so a mounted avatar picks one up (useSyncExternalStore's subscribe). */
export function userPicturesSubscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** The picture graphql last answered for this person, if any. */
export function userPicture(email?: string): string | undefined {
  return email ? byEmail.get(key(email)) : undefined
}

/** Remember every user in a graphql response that was asked for its `picture` beside its `email`. */
export function rememberPictures(data: unknown) {
  let changed = false
  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) return node.forEach(walk)
    const { email, picture } = node as { email?: unknown; picture?: unknown }
    if (typeof email === 'string' && 'picture' in node) {
      const k = key(email)
      if (typeof picture === 'string' && byEmail.get(k) !== picture) {
        byEmail.set(k, picture)
        changed = true
      } else if (typeof picture !== 'string' && byEmail.delete(k)) changed = true
    }
    Object.values(node).forEach(walk)
  }
  walk(data)
  if (changed) listeners.forEach(listener => listener())
}
