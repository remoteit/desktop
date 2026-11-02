import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Button, List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material'
import type { TFunction } from 'i18next'
import {
  ACCESS_OUTCOMES,
  AccessOutcome,
  AccessScope,
  FAILURES,
  ProxyAccess,
  graphQLProxyAccess,
} from '../services/graphQLProxyAccess'
import { UNSUPPORTED } from '../services/graphQLDaemon'
import { humanizeDuration } from '../helpers/dateHelper'
import { SelectSetting } from './SelectSetting'
import { Timestamp } from './Timestamp'
import { Icon } from './Icon'

type Props = { scope: AccessScope; showEndpoint?: boolean; showProxy?: boolean }

export function outcomeLabel(t: TFunction, outcome: AccessOutcome | string): string {
  switch (outcome) {
    case 'served':
      return t('proxyAccess.outcome.served', 'Served')
    case 'refused':
      return t('proxyAccess.outcome.refused', 'No session: refused')
    case 'unanswered':
      return t('proxyAccess.outcome.unanswered', 'No session: no answer')
    case 'timed-out':
      return t('proxyAccess.outcome.timedOut', 'No session: timed out')
    case 'busy':
      return t('proxyAccess.outcome.busy', 'No session: too many waiting')
    case 'password-refused':
      return t('proxyAccess.outcome.passwordRefused', 'Wrong password')
    case 'rate-limited':
      return t('proxyAccess.outcome.rateLimited', 'Too many password attempts')
    case 'address-refused':
      return t('proxyAccess.outcome.addressRefused', 'Address not allowed')
    case 'ticket-refused':
      return t('proxyAccess.outcome.ticketRefused', 'Sign-in refused')
    case 'unknown-endpoint':
      return t('proxyAccess.outcome.unknownEndpoint', 'No such endpoint')
    case 'abandoned':
      return t('proxyAccess.outcome.abandoned', 'Left before being served')
  }
  return t('proxyAccess.outcome.unknown', 'Unknown')
}

const bytes = (n: number) =>
  n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(1)} MB`

/* Who used a proxy endpoint, when, and how it ended (services/graphQLProxyAccess.ts): a service's endpoints, a proxy's,
   or remote.it's public proxies'; newest first, filtered by outcome, a page at a time. The visitor's address is masked
   by graphql for whoever does not manage the proxy. Device-session API only: on an API without it, nothing shows. */
export const ProxyAccessList: React.FC<Props> = ({ scope, showEndpoint, showProxy }) => {
  const { t } = useTranslation()
  const [filter, setFilter] = useState('')
  const [items, setItems] = useState<ProxyAccess[]>()
  const [last, setLast] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [state, setState] = useState<'loading' | 'ERROR' | 'ready' | typeof UNSUPPORTED>('loading')
  const key = JSON.stringify(scope)

  const outcomes = filter === 'failures' ? [...FAILURES] : filter ? [filter] : undefined

  const load = useCallback(
    async (after?: string) => {
      setState('loading')
      const page = await graphQLProxyAccess(scope, outcomes, after)
      if (page === UNSUPPORTED || page === 'ERROR' || !page)
        return setState(page === UNSUPPORTED ? UNSUPPORTED : 'ERROR')
      setItems(current => (after ? [...(current ?? []), ...page.items] : page.items))
      setLast(page.last)
      setHasMore(page.hasMore)
      setState('ready')
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, filter]
  )

  useEffect(() => {
    setItems(undefined)
    load()
  }, [load])

  if (state === UNSUPPORTED) return null

  return (
    <>
      <List disablePadding>
        <SelectSetting
          icon="filter"
          label={t('proxyAccess.show', 'Show')}
          value={filter}
          values={[
            { key: '', name: t('proxyAccess.all', 'All') },
            { key: 'failures', name: t('proxyAccess.failures', 'Not served') },
            ...ACCESS_OUTCOMES.filter(o => o !== 'unknown').map(o => ({ key: o, name: outcomeLabel(t, o) })),
          ]}
          onChange={setFilter}
        />
      </List>
      {state === 'ERROR' && (
        <Typography variant="body2" color="error" paddingX={2}>
          {t('proxyAccess.error', 'Could not read the visitors.')}
        </Typography>
      )}
      {items && !items.length && state === 'ready' && (
        <Typography variant="body2" color="textSecondary" paddingX={2} paddingBottom={1}>
          {t('proxyAccess.none', 'No visitors in the days kept.')}
        </Typography>
      )}
      {!!items?.length && (
        <List dense disablePadding>
          {items.map(access => (
            <ListItem key={`${access.proxyId}:${access.id}`}>
              <ListItemIcon>
                <Icon
                  name={access.outcome === 'served' ? 'check' : 'ban'}
                  color={access.outcome === 'served' ? 'success' : 'warning'}
                  size="md"
                  fixedWidth
                />
              </ListItemIcon>
              <ListItemText
                primary={
                  <>
                    {access.visitor || t('proxyAccess.noAddress', 'unknown address')}
                    {access.visitorPort ? `:${access.visitorPort}` : ''}
                    {access.userEmail && ` · ${access.userEmail}`}
                    {' · '}
                    {outcomeLabel(t, access.outcome)}
                    {access.code ? ` (${t('proxyAccess.code', 'error {{code}}', { code: access.code })})` : ''}
                  </>
                }
                secondary={
                  <>
                    <Timestamp date={new Date(access.started)} />
                    {' · '}
                    {humanizeDuration(access.durationMs, { largest: 2, round: true })}
                    {' · '}
                    {t('proxyAccess.bytes', '{{in}} in, {{out}} out', {
                      in: bytes(access.bytesIn),
                      out: bytes(access.bytesOut),
                    })}
                    {showProxy && ` · ${access.proxyId}`}
                    {showEndpoint &&
                      ` · ${access.kind}${access.name ? ` ${access.name}` : ''}${
                        access.port ? ` :${access.port}` : ''
                      }`}
                    {access.passwordFailures > 0 &&
                      ` · ${t('proxyAccess.passwordFailures', 'wrong passwords: {{number}}', {
                        number: access.passwordFailures,
                      })}`}
                    {access.reason && ` · ${access.reason}`}
                    {access.masked && ` · ${t('proxyAccess.masked', 'address partly hidden')}`}
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
      {hasMore && (
        <Box paddingX={2} paddingBottom={1}>
          <Button size="small" disabled={state === 'loading'} onClick={() => load(last ?? undefined)}>
            {t('proxyAccess.more', 'More')}
          </Button>
        </Box>
      )}
    </>
  )
}
