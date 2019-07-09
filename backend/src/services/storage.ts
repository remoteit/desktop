import { session } from 'electron'
import logger from '../utils/logger'
import { application } from '../backend'

export async function set(name: string, value: string) {
  // Set expiration to a long time into the future. set()
  // expects a unix epoch, in seconds
  const durationYears = 1
  const date = new Date()
  date.setFullYear(date.getFullYear() + durationYears)
  const expirationDate = Math.floor(date.getTime() / 1000)

  logger.info('Setting cookie', { name, value, expirationDate })

  return getCookies().set({
    url: application.url || 'http://localhost:3000',
    name,
    value,
    // path: '/',
    // secure: true,
    expirationDate,
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
  logger.info('Get cookie:', { cookie })
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
