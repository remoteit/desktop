import { httpsOnly } from '../helpers/utilHelper'

const byEmail = new Map<string, string>()
const listeners = new Set<() => void>()

const key = (email: string) => email.trim().toLowerCase()

export function userPicturesSubscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function userPicture(email?: string): string | undefined {
  return email ? byEmail.get(key(email)) : undefined
}

export function rememberPictures(data: unknown, errors?: ({ path?: readonly (string | number)[] } | null)[] | null) {
  const failed = (errors ?? []).map(error => error?.path?.join('.') ?? '')
  const erred = (path: string) => failed.some(f => !f || path === f || path.startsWith(`${f}.`))
  let changed = false
  const walk = (node: unknown, path: string) => {
    if (!node || typeof node !== 'object') return
    const { email, picture } = node as { email?: unknown; picture?: unknown }
    if (typeof email === 'string' && 'picture' in node) {
      const k = key(email)
      const next = httpsOnly(picture)
      if (byEmail.get(k) !== next && (next || !erred(`${path}.picture`))) {
        changed = true
        if (next) byEmail.set(k, next)
        else byEmail.delete(k)
      }
    }
    for (const [field, value] of Object.entries(node)) walk(value, path ? `${path}.${field}` : field)
  }
  walk(data, '')
  if (changed) listeners.forEach(listener => listener())
}
