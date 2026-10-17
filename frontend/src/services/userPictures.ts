import { httpsOnly } from '../helpers/utilHelper'

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
    const { email, picture } = node as { email?: unknown; picture?: unknown }
    if (typeof email === 'string' && 'picture' in node) {
      const k = key(email)
      const next = httpsOnly(picture)
      if (byEmail.get(k) !== next) {
        changed = true
        if (next) byEmail.set(k, next)
        else byEmail.delete(k)
      }
    }
    Object.values(node).forEach(walk)
  }
  walk(data)
  if (changed) listeners.forEach(listener => listener())
}
