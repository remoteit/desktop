import type { TFunction } from 'i18next'
import type { AccountProxyBase, ProxyMove } from '../services/graphQLProxy'

/* The account's base for its proxies' names (graphql-api docs/PROXY-GROUPS.md §14, wave 3b), as the portal says it:
   where it stands — on its page (pages/ProxyBasePage.tsx), and in a line on the Proxies page — and the certificate a
   move under it or back leaves the moved proxies' https endpoints with. */

export type BaseLine = { icon: string; color: 'warning' | 'success' | 'danger'; label: string; hint: string }

// Where it stands: pending, with how many NS records are found; verified; active, with how many proxies are named
// under it; broken, naming each NS record gone or wrong.
export function baseLine(t: TFunction, base: AccountProxyBase): BaseLine {
  if (base.state === 'pending')
    return {
      icon: 'hourglass',
      color: 'warning',
      label: t('proxyBase.pending', 'Pending: {{found}} of {{total}} NS records found', {
        found: base.records.filter(record => record.found).length,
        total: base.records.length,
      }),
      hint: t('proxyBase.pendingHint', 'Add them where your DNS is hosted, then check them'),
    }
  if (base.state === 'verified')
    return {
      icon: 'badge-check',
      color: 'success',
      label: t('proxyBase.verified', 'Verified. Remote.It sees your domain.'),
      hint: t('proxyBase.verifiedHint', 'The account’s proxies move under it once you confirm'),
    }
  if (base.state === 'active')
    return {
      icon: 'circle-check',
      color: 'success',
      label: t('proxyBase.active', {
        count: base.proxies,
        defaultValue_one: 'Active: {{count}} proxy named under it',
        defaultValue_other: 'Active: {{count}} proxies named under it',
      }),
      hint: '',
    }
  if (base.state === 'broken') {
    const wrong = base.records
      .filter(record => !record.found)
      .map(record =>
        record.seen
          ? t('proxyBase.recordWrong', '{{type}} {{value}} is wrong: it answers {{seen}}', {
              type: record.type,
              value: record.value,
              seen: record.seen,
            })
          : t('proxyBase.recordMissing', '{{type}} {{value}} is missing', { type: record.type, value: record.value })
      )
    return {
      icon: 'triangle-exclamation',
      color: 'danger',
      label: wrong.length
        ? t('proxyBase.broken', 'Broken: {{records}}', { records: wrong.join('; ') })
        : t('ownName.brokenNone', 'Broken'),
      hint: t(
        'proxyBase.brokenHint',
        'Until its NS records are right, names under it may not answer, and their certificates cannot be renewed'
      ),
    }
  }
  return { icon: 'hourglass', color: 'warning', label: base.state, hint: '' }
}

// Where it stands, in a line: the Proxies page's.
export const baseStateLine = (t: TFunction, base: AccountProxyBase) => baseLine(t, base).label

// The certificate the moved proxies' https endpoints are served with after: the base's moving under it, remote.it's
// for every proxy name moving back.
export function baseMoveCertificateLine(
  t: TFunction,
  mode: 'verify' | 'remove',
  certificate: ProxyMove['certificate'],
  base: string
): string {
  if (mode === 'remove')
    return certificate === 'ready'
      ? t('proxyBase.backReady', 'Their HTTPS public addresses use Remote.It’s certificate for every proxy name.')
      : t(
          'proxyBase.backPending',
          'Remote.It’s certificate for every proxy name isn’t issued yet. Their HTTPS public addresses don’t work until it is.'
        )
  if (certificate === 'ready')
    return t('proxyBase.moveReady', 'Their HTTPS public addresses use the certificate for {{base}}.', { base })
  if (certificate === 'failed')
    return t(
      'proxyBase.moveFailed',
      'The certificate for {{base}} couldn’t be issued. Their HTTPS public addresses under it don’t work until it is.',
      { base }
    )
  return t(
    'proxyBase.movePending',
    'The certificate for {{base}} isn’t issued yet. Their HTTPS public addresses under it don’t work until it is.',
    { base }
  )
}
