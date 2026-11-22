import type { TFunction } from 'i18next'
import type { Endpoint } from '../services/graphQLProxy'

export function whoMayUse(t: TFunction, endpoint: Pick<Endpoint, 'access' | 'lockedIp' | 'allow'>): string {
  switch (endpoint.access) {
    case 'public':
      return t('publicAddress.anyone', 'Anyone with the address')
    case 'signed-in':
      return t('publicAddress.signedIn', 'People who may connect, signed in')
    case 'ip-locked':
      return t('publicAddress.ipLocked', 'Only {{ip}}', { ip: endpoint.lockedIp })
    case 'latch':
      return t('publicAddress.latch', 'Only its first user')
    case 'cidr':
      return endpoint.allow?.length
        ? t('publicAddress.cidr', 'Only {{allow}}', { allow: endpoint.allow.join(', ') })
        : t('publicAddress.cidrNone', 'Only addresses you list')
  }
  return ''
}

// When it goes: never for a permanent one; a temporary one is released after it sits unused.
export function expiresLine(t: TFunction, endpoint: Pick<Endpoint, 'lifetime' | 'expires'>, now = Date.now()): string {
  if (endpoint.lifetime === 'permanent') return t('publicAddress.permanent', 'Never expires')
  if (!endpoint.expires) return t('publicAddress.temporary', 'Expires when unused')
  const minutes = Math.max(0, Math.round((new Date(endpoint.expires).getTime() - now) / 60000))
  if (minutes < 1) return t('publicAddress.expiresSoon', 'Expires in under a minute unless used')
  if (minutes < 120)
    return t('publicAddress.expiresMinutes', {
      count: minutes,
      defaultValue_one: 'Expires in {{count}} minute unless used',
      defaultValue_other: 'Expires in {{count}} minutes unless used',
    })
  return t('publicAddress.expiresAt', 'Expires {{date}} unless used', {
    date: new Date(endpoint.expires).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }),
  })
}

export function kindLabel(t: TFunction, kind: Endpoint['kind']): string {
  return { https: t('publicAddress.https', 'Web (HTTPS)'), tcp: 'TCP', udp: 'UDP' }[kind]
}

// Where it can be opened in a browser: an HTTPS one only.
export const openable = (endpoint: Pick<Endpoint, 'kind' | 'url'>) =>
  endpoint.kind === 'https' && /^https:\/\//.test(endpoint.url)
