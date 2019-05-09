import { session } from 'electron'

export async function set(name: string, value: string) {
  return getCookies().set({
    url: '/',
    name,
    value,
    path: '/',
    // secure: true,
    expirationDate: 999999999999999.0,
  })
}
export async function flush() {
  return getCookies().flushStore()
}

// TODO: not working!
export async function remove(name: string) {
  return getCookies().remove('/', name)
}

export async function clear() {
  return getSession().clearStorageData()
}

export async function get(name: string) {
  // @ts-ignore
  const [cookie] = await getCookies().get({ path: '/', name })
  if (!cookie) return undefined
  return cookie.value as string
}

export function getSession() {
  if (!session || !session.defaultSession)
    throw new Error('Could not get default user session')
  return session.defaultSession
}

export function getCookies() {
  return getSession().cookies
}
