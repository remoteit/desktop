import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { Box, Button, List, ListItem, ListItemIcon, ListItemText } from '@mui/material'
import {
  DEFAULT_WINDOW,
  ExitFlowsScope,
  UserExitFlow,
  WINDOWS,
  appendFlows,
  fetchExitFlows,
} from '../services/exitFlows'
import { flowOpener } from '../services/adminExitFlows'
import { UNSUPPORTED } from '../services/graphQLDaemon'
import { humanizeDuration } from '../helpers/dateHelper'
import { formatBytes } from '../helpers/usageHelper'
import { SelectSetting } from './SelectSetting'
import { Timestamp } from './Timestamp'
import { Icon } from './Icon'
import { useReadCallback, useReadEffect } from '../hooks/useReadAgain'

// The API refuses with this when the back end keeps no flow log at all: not an error the person can act on.
const NO_LOG = /keeps no (exit )?flow log/i

// carrier: the device whose page this is — a flow it carried as an exit says so, rather than the exit's name.
type Props = { scope: ExitFlowsScope; carrier?: string }

export function windowLabel(t: TFunction, hours: number): string {
  if (hours === 1) return t('exitFlows.window.hour', 'Last hour')
  if (hours === 24) return t('exitFlows.window.day', 'Last day')
  if (hours === 24 * 7) return t('exitFlows.window.week', 'Last week')
  return t('exitFlows.window.days', 'Last {{days}} days', { days: Math.round(hours / 24) })
}

/* Connections through exits (services/exitFlows.ts): a device's or an exit's, those the person may see — graphql
   decides —, newest first, over a window, a page at a time. Each: where it went, when, how long, how much, through which
   exit, and who on the computer opened it. A page may come back empty with more to read (the log is read a part at a
   time): "Look further" goes on. Device-session API only: on an API without it, nothing shows. */
export const ExitFlowList: React.FC<Props> = ({ scope, carrier }) => {
  const { t } = useTranslation()
  const [hours, setHours] = useState(DEFAULT_WINDOW)
  const [flows, setFlows] = useState<UserExitFlow[]>()
  const [next, setNext] = useState<string | null>(null)
  const [state, setState] = useState<'loading' | 'ERROR' | 'ready' | typeof UNSUPPORTED>('loading')
  const [reason, setReason] = useState<string>()
  // The window is fixed when it is first read: every page after goes on in the same one.
  const now = useRef(new Date())
  const key = JSON.stringify(scope)

  const load = useReadCallback(
    async (after?: string) => {
      setState('loading')
      setReason(undefined)
      if (!after) now.current = new Date()
      const page = await fetchExitFlows(scope, { hours, now: now.current }, after)
      // The first page not read: none shown, rather than those read before (as another sign-in, or of another scope).
      const none = () => {
        if (after) return
        setFlows(undefined)
        setNext(null)
      }
      if (page === UNSUPPORTED || page === 'ERROR') return none(), setState(page)
      if ('reason' in page) {
        none()
        setReason(page.reason)
        return setState('ERROR')
      }
      setFlows(current => (after ? appendFlows(current ?? [], page.flows) : appendFlows([], page.flows)))
      setNext(page.next)
      setState('ready')
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, hours]
  )

  useReadEffect(
    again => {
      if (!again) setFlows(undefined)
      if (!again) setNext(null)
      load()
    },
    [load]
  )

  if (state === UNSUPPORTED) return null

  const noLog = state === 'ERROR' && !!reason && NO_LOG.test(reason)

  return (
    <>
      <List disablePadding>
        <SelectSetting
          icon="clock"
          label={t('exitFlows.window.label', 'When')}
          value={String(hours)}
          values={WINDOWS.map(h => ({ key: String(h), name: windowLabel(t, h) }))}
          onChange={value => setHours(Number(value))}
        />
        {noLog && (
          <ListItem>
            <ListItemIcon />
            <ListItemText
              secondary={t('exitFlows.noLog', 'No connection log is kept for this account.')}
              secondaryTypographyProps={{ 'data-testid': 'exit-flows-none' } as any}
            />
          </ListItem>
        )}
        {state === 'ERROR' && !noLog && (
          <ListItem>
            <ListItemIcon>
              <Icon name="exclamation-triangle" size="md" color="danger" />
            </ListItemIcon>
            <ListItemText
              primary={reason || t('exitFlows.error', 'Could not read the connections.')}
              primaryTypographyProps={{ color: 'error', 'data-testid': 'exit-flows-error' } as any}
            />
          </ListItem>
        )}
        {flows && !flows.length && state === 'ready' && (
          <ListItem>
            <ListItemIcon />
            <ListItemText
              secondary={
                next
                  ? t('exitFlows.noneYet', 'None found so far: there is more to look through.')
                  : t('exitFlows.none', 'No connections through an exit in this time.')
              }
              secondaryTypographyProps={{ 'data-testid': 'exit-flows-none' } as any}
            />
          </ListItem>
        )}
      </List>
      {!!flows?.length && (
        <List dense disablePadding data-testid="exit-flows">
          {flows.map(flow => (
            <ExitFlowItem key={flow.id} flow={flow} carrier={carrier} />
          ))}
        </List>
      )}
      {next && (
        <Box paddingX={2} paddingBottom={1}>
          <Button size="small" disabled={state === 'loading'} onClick={() => load(next)} data-testid="exit-flows-more">
            {flows?.length ? t('exitFlows.more', 'More') : t('exitFlows.further', 'Look further')}
          </Button>
        </Box>
      )}
    </>
  )
}

const ExitFlowItem: React.FC<{ flow: UserExitFlow; carrier?: string }> = ({ flow, carrier }) => {
  const { t } = useTranslation()
  const opener = flowOpener(flow)
  const lasted = new Date(flow.end).getTime() - new Date(flow.start).getTime()
  const carried = !!carrier && flow.exitId.toUpperCase() === carrier.toUpperCase()
  const through = carried
    ? t('exitFlows.carried', 'as an exit device')
    : t('exitFlows.through', 'through {{exit}}', { exit: flow.exitName || flow.exit || flow.exitId })
  return (
    <ListItem data-flow={flow.id}>
      <ListItemIcon>
        <Icon name={carried ? 'server' : 'globe'} size="md" fixedWidth />
      </ListItemIcon>
      <ListItemText
        primary={
          <>
            {flow.destination}
            {flow.proto ? ` · ${flow.proto}` : ''}
            {opener && ` · ${opener}`}
          </>
        }
        secondary={
          <>
            <Timestamp date={new Date(flow.start)} />
            {' · '}
            {Number.isFinite(lasted) && lasted >= 0 ? humanizeDuration(lasted, { largest: 2, round: true }) : '—'}
            {' · '}
            {t('exitFlows.bytes', '{{up}} up, {{down}} down', {
              up: formatBytes(flow.up),
              down: formatBytes(flow.down),
            })}
            {' · '}
            {through}
          </>
        }
      />
    </ListItem>
  )
}
