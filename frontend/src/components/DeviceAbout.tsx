import React, { useEffect, useMemo, useState } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Link } from '@mui/material'
import { CopyIconButton } from '../buttons/CopyIconButton'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Link as RouterLink } from 'react-router-dom'
import { Box, List, ListItem, ListItemButton, ListSubheader, Typography } from '@mui/material'
import { historyPhrase } from '../helpers/deviceHistory'
import { getAllDevices } from '../selectors/devices'
import { selectActiveAccountId } from '../selectors/accounts'
import { useKnownCopies } from '../hooks/useDeviceIdentity'
import { useDeviceSignIns } from '../hooks/useDeviceSignIns'
import { DeviceSignIn } from '../services/deviceSignIns'
import { UNSUPPORTED } from '../services/graphQLDaemon'
import {
  DeviceAbout as About,
  DeviceAboutAccount,
  DeviceAboutChange,
  DeviceAboutRead,
  graphQLDeviceAbout,
} from '../services/graphQLDeviceAbout'
import { Notice } from './Notice'
import { Timestamp } from './Timestamp'
import { DeviceSection } from './DeviceSection'
import { spacing } from '../styling'

type Row = [label: string, value: React.ReactNode]

/* What a device says it is (services/graphQLDeviceAbout) on its details page: System, Identifiers, the Product its
   manufacturer declares, its Software, the machine's Accounts, and the History of every field; a new administrator or
   a change of hardware at the top. Behind the device-sessions flag; nothing where the API does not serve it or the
   device has said nothing (a legacy agent, or one from before `about`). Someone the device is shared with is served its
   OS, architecture and software alone: every other part is none, and is left out. */
export const DeviceAbout: React.FC<{ deviceId: string; part?: 'about' | 'history' }> = ({ deviceId, part }) => {
  const { t } = useTranslation()
  const [read, setRead] = useState<DeviceAboutRead | 'ERROR' | typeof UNSUPPORTED>()
  const [details, setDetails] = useState(false)
  // The devices this viewer can open, by id: those the portal has read, and the copies awaiting a decision.
  const devices = useSelector(getAllDevices)
  const copies = useKnownCopies(useSelector(selectActiveAccountId))
  const known = useMemo(
    () => new Map<string, string>([...devices, ...copies].map(device => [device.id, device.name])),
    [devices, copies]
  )

  // Who is signed in on each account, asked only where the device lists its accounts.
  const listed = !!read && typeof read === 'object' && !!read.about?.accounts?.length
  const signIns = useDeviceSignIns(listed ? deviceId : undefined)

  useEffect(() => {
    let current = true
    setRead(undefined)
    graphQLDeviceAbout(deviceId).then(result => current && setRead(result))
    return () => {
      current = false
    }
  }, [deviceId])

  if (!read || read === UNSUPPORTED || read === 'ERROR' || (!read.about && !read.history.length)) return null

  const { about, history } = read
  const os = about?.os
  const hw = about?.hardware
  const ids = about?.ids
  const oem = about?.oem
  const sw = about?.software

  const system: Row[] = [
    [t('deviceAbout.os', 'OS'), [os?.name, os?.version, os?.edition].filter(Boolean).join(' ')],
    [t('deviceAbout.build', 'Build'), os?.build],
    [t('deviceAbout.kernel', 'Kernel'), os?.kernel],
    [t('deviceAbout.manufacturer', 'Manufacturer'), hw?.manufacturer],
    [t('deviceAbout.model', 'Model'), hw?.model],
    [t('deviceAbout.board', 'Board'), hw?.board],
    [
      t('deviceAbout.cpu', 'CPU'),
      [hw?.cpu, hw?.cores && t('deviceAbout.cores', '{{count}} cores', { count: hw.cores })].filter(Boolean).join(', '),
    ],
    [t('deviceAbout.arch', 'Architecture'), hw?.arch],
    [t('deviceAbout.memory', 'Memory'), hw?.memoryMb ? memory(hw.memoryMb) : null],
    [t('deviceAbout.virtual', 'Virtual'), hw?.virtual && hw.virtual !== 'none' ? hw.virtual : null],
    [t('deviceAbout.nat', 'NAT'), about?.nat ? <NAT nat={about.nat} /> : null],
  ]
  const identifiers: Row[] = [
    [t('deviceAbout.serial', 'Serial'), ids?.serial],
    [t('deviceAbout.hardwareUuid', 'Hardware UUID'), ids?.hardwareUuid],
    [t('deviceAbout.machineId', 'Machine ID'), ids?.machineId !== ids?.hardwareUuid ? ids?.machineId : null],
    [t('deviceAbout.diskSerial', 'Boot disk serial'), ids?.diskSerial],
    [
      t('deviceAbout.macs', 'Network interfaces'),
      ids?.macs?.length ? (
        <Box component="span">
          {ids.macs.map(m => (
            <Box key={`${m.interface} ${m.mac}`} component="span" sx={{ display: 'block' }}>
              {m.interface}{' '}
              <Typography component="span" variant="body2" color="grayDark.main">
                {m.mac}
              </Typography>
            </Box>
          ))}
        </Box>
      ) : null,
    ],
  ]
  const product: Row[] = [
    [
      t('deviceAbout.product', 'Product'),
      [oem?.productName, oem?.product && `(${oem.product})`].filter(Boolean).join(' '),
    ],
    [t('deviceAbout.manufacturer', 'Manufacturer'), oem?.manufacturer],
    [t('deviceAbout.model', 'Model'), oem?.model],
    [t('deviceAbout.hardwareRevision', 'Hardware revision'), oem?.hardwareRevision],
    [t('deviceAbout.firmware', 'Firmware'), oem?.firmware],
    [t('deviceAbout.serial', 'Serial'), oem?.serial],
  ]
  const software: Row[] = [
    [t('deviceAbout.agent', 'Agent'), sw?.connectd],
    [t('deviceAbout.package', 'Package'), [sw?.package, sw?.format && `(${sw.format})`].filter(Boolean).join(' ')],
  ]

  const showAbout = part !== 'history'
  return (
    <>
      {showAbout && !!about?.adminsAdded?.length && (
        <Notice severity="warning" fullWidth>
          {about.adminsAdded.map(added => (
            <Box key={`${added.name} ${added.at}`}>
              {t('deviceAbout.adminAdded', 'A new administrator on the machine: {{name}}', { name: added.name })}{' '}
              <Timestamp date={new Date(added.at)} variant="minutes" />
            </Box>
          ))}
        </Notice>
      )}
      {showAbout && about?.hardwareChanged && (
        <Notice severity="warning" fullWidth>
          {t(
            'deviceAbout.hardwareChanged',
            'Its serial or hardware ID changed: this device ID may now be on other hardware — a copied image or SD card.'
          )}{' '}
          <Timestamp date={new Date(about.hardwareChanged)} variant="minutes" />
        </Notice>
      )}
      {showAbout && (
        <>
      <Section
        title={t('deviceAbout.system', 'System')}
        rows={system}
        action={
          about?.data && (
            <Button size="small" onClick={() => setDetails(true)}>
              {t('deviceAbout.viewDetails', 'View details')}
            </Button>
          )
        }
      />
      <Section title={t('deviceAbout.identifiers', 'Identifiers')} rows={identifiers} />
      <Section title={t('deviceAbout.declaredProduct', 'Product — declared by the manufacturer')} rows={product} />
      <Section title={t('deviceAbout.software', 'Software')} rows={software} />
      {about && <Accounts about={about} signIns={signIns} />}
      {about?.reported && (
        <Typography variant="caption" color="grayDark.main" component="p" sx={{ paddingBottom: 1 }}>
          {t('deviceAbout.reported', 'As the device last reported it')}{' '}
          <Timestamp date={new Date(about.reported)} variant="minutes" />
        </Typography>
      )}
      {about?.data && <AboutDetails open={details} data={about.data} onClose={() => setDetails(false)} />}
        </>
      )}
      {!!history.length && part !== 'about' && <DeviceHistory history={history} known={known} />}
    </>
  )
}

/* An entry's text with the other device it names — a copy, the original, the device swapped with — linked to its page
   by its name, where this viewer can open it; as its ID otherwise. */
export const DeviceMention: React.FC<{ text: string; deviceId?: string; known: Map<string, string> }> = ({
  text,
  deviceId,
  known,
}) => {
  const at = deviceId ? text.indexOf(deviceId) : -1
  if (!deviceId || at < 0 || !known.has(deviceId)) return <>{text}</>
  return (
    <>
      {text.slice(0, at)}
      <Link component={RouterLink} to={`/devices/${deviceId}`} title={deviceId}>
        {known.get(deviceId) || deviceId}
      </Link>
      {text.slice(at + deviceId.length)}
    </>
  )
}

// The other device a history entry names: a duplicate's copy, original, or the device its machine was swapped with.
export function otherDevice(change: DeviceAboutChange): string | undefined {
  if (change.kind !== 'duplicate' || !change.after) return undefined
  return ['copy', 'copy-of', 'original', 'kept'].includes(change.field) ? change.after : undefined
}

// The document exactly as the device said it, and kept: every field, the ones the page leaves out too.
const AboutDetails: React.FC<{ open: boolean; data: ILookup<any>; onClose: () => void }> = ({
  open,
  data,
  onClose,
}) => {
  const { t } = useTranslation()
  const json = JSON.stringify(data, null, 2)
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {t('deviceAbout.detailsTitle', 'As the device reported it')}
        <CopyIconButton value={json} title={t('deviceAbout.copy', 'Copy')} size="md" color="grayDark" />
      </DialogTitle>
      <DialogContent>
        <Box
          component="pre"
          data-about-json
          sx={{ margin: 0, fontFamily: 'monospace', fontSize: 12, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
        >
          {json}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('deviceAbout.close', 'Close')}</Button>
      </DialogActions>
    </Dialog>
  )
}

const Section: React.FC<{ title: string; rows: Row[]; action?: React.ReactNode; children?: React.ReactNode }> = ({
  title,
  rows,
  action,
  children,
}) => {
  const shown = rows.filter(([, value]) => value != null && value !== '')
  if (!shown.length && !React.Children.toArray(children).length) return null
  return (
    <List dense sx={{ paddingBottom: 1 }}>
      <ListSubheader disableGutters sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {title}
        {action}
      </ListSubheader>
      {shown.map(([label, value]) => (
        <ListItem key={label} disableGutters sx={{ alignItems: 'flex-start' }}>
          <Box component="span" sx={{ color: 'grayDark.main', minWidth: 160 }}>
            {label}:
          </Box>
          <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', wordBreak: 'break-word' }}>
            {value}
          </Box>
        </ListItem>
      ))}
      {children}
    </List>
  )
}

/* The machine's OS accounts, administrators first: each by its name, its full name, local or domain, whether it
   administers the machine, its flags, and who is signed in on it (Device.signIns, joined on the OS's id). Where the
   machine's administrator turned the list off (account_report_control off), says so; nothing where there is no list —
   a viewer, or a daemon from before it. */
const Accounts: React.FC<{ about: About; signIns?: DeviceSignIn[] | null }> = ({ about, signIns }) => {
  const { t } = useTranslation()
  const accounts = about.accounts ?? []
  const more = about.accountsMore ?? 0
  const off = accountReportOff(about)
  if (!accounts.length && !more && !off) return null

  const rows: Row[] = accounts.map(account => [account.name, <Account account={account} signIns={signIns} />])
  return (
    <Section title={t('deviceAbout.accounts', 'Accounts')} rows={rows}>
      {!!more && (
        <ListItem disableGutters sx={{ color: 'grayDark.main' }}>
          {t('deviceAbout.accountsMore', '+{{count}} more', { count: more })}
        </ListItem>
      )}
      {off && !accounts.length && (
        <ListItem disableGutters sx={{ color: 'grayDark.main' }}>
          {t('deviceAbout.accountsOff', "The machine's administrator turned the account list off.")}
        </ListItem>
      )}
    </Section>
  )
}

const Account: React.FC<{ account: DeviceAboutAccount; signIns?: DeviceSignIn[] | null }> = ({ account, signIns }) => {
  const { t } = useTranslation()
  const how = [
    account.kind === 'domain'
      ? t('deviceAbout.accountDomain', 'Domain')
      : account.kind === 'local'
      ? t('deviceAbout.accountLocal', 'Local')
      : null,
    account.admin && t('deviceAbout.accountAdmin', 'Administrator'),
    account.hidden && t('deviceAbout.accountHidden', 'Hidden'),
    account.disabled && t('deviceAbout.accountDisabled', 'Disabled'),
    account.remoteit && t('deviceAbout.accountRemoteit', "remote.it's own"),
  ].filter(Boolean)
  const signedIn = (signIns ?? []).filter(signIn => signIn.account === account.account)
  return (
    <Box component="span">
      {account.fullName}
      {account.fullName && !!how.length && ' — '}
      <Typography component="span" variant="body2" color="grayDark.main">
        {how.join(', ')}
      </Typography>
      {signedIn.map(signIn => (
        <Box key={signIn.person.id} component="span" sx={{ display: 'block' }}>
          {t('deviceAbout.accountSignedIn', 'Signed in as {{person}}', {
            person: signIn.person.email || signIn.person.id,
          })}
        </Box>
      ))}
    </Box>
  )
}

/* Whether the machine's administrator turned the account report off: its local policy's control, as the device said
   it (about.policy.controls; connectd names a policy-only control without its _control suffix). */
export function accountReportOff(about: About) {
  const controls = about.data?.policy?.controls
  return controls?.account_report === 'off' || controls?.account_report_control === 'off'
}

// The NAT the device measured itself behind, in a word and what makes it so — what decides whether another device
// reaches it directly — and since when; or why it was not measured.
const NAT: React.FC<{ nat: NonNullable<About['nat']> }> = ({ nat }) => {
  const { t } = useTranslation()
  if (!nat.mapping || !nat.filtering)
    return <>{t('deviceAbout.natNotMeasured', 'Not measured ({{why}})', { why: nat.why ?? '' })}</>
  return (
    <>
      {natLabel(t, nat.mapping, nat.filtering)}
      {(nat.note || nat.since) && (
        <Typography component="span" variant="body2" color="grayDark.main">
          {nat.note && ` — ${t('deviceAbout.natAssumed', 'assumed: {{note}}', { note: nat.note })}`}
          {nat.since && (
            <>
              {' '}
              — {t('deviceAbout.natSince', 'since')} <Timestamp date={new Date(nat.since)} variant="minutes" />
            </>
          )}
        </Typography>
      )}
    </>
  )
}

/* open: anyone may answer the one port it uses for every destination; moderate: one port for every destination, answers
   filtered — a direct path opens from both sides at once; strict: a port per destination, which the other side cannot
   predict, so a session may go through the relay. As the device's own status says it (connectd device/nat.go). */
export function natLabel(t: TFunction, mapping: string, filtering: string) {
  const strict = mapping === 'endpoint-dependent' || mapping === 'pool'
  const label = strict
    ? t('deviceAbout.natStrict', 'strict')
    : mapping === 'endpoint-independent' && filtering === 'endpoint-independent'
    ? t('deviceAbout.natOpen', 'open')
    : t('deviceAbout.natModerate', 'moderate')
  const how = [
    {
      'endpoint-independent': t('deviceAbout.natNoFiltering', 'no filtering'),
      'address-dependent': t('deviceAbout.natAddressFiltering', 'address filtering'),
      'address-and-port-dependent': t('deviceAbout.natAddressPortFiltering', 'address-and-port filtering'),
    }[filtering],
    {
      'endpoint-independent': t('deviceAbout.natOnePort', 'one port for every destination'),
      'endpoint-dependent': t('deviceAbout.natPortPerDestination', 'one port per destination'),
      pool: t('deviceAbout.natPool', 'a port per destination, over several addresses'),
    }[mapping],
  ].filter(Boolean)
  return how.length ? `${label} (${how.join(', ')})` : label
}

const memory = (mb: number) => (mb >= 1024 ? `${Math.round((mb / 1024) * 10) / 10} GB` : `${mb} MB`)

export const DeviceHistory: React.FC<{ history: DeviceAboutChange[]; known: Map<string, string> }> = ({
  history,
  known,
}) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState<number>()
  return (
    <DeviceSection id="history" title={t('deviceHistory.title', 'Changes on the device')} list={false}>
    <List dense disablePadding data-device-history sx={{ paddingX: `${spacing.xl}px` }}>
      {history.map((change, index) => {
        const phrase = historyPhrase(t, change)
        const expanded = open === index
        const content = (
          <Box sx={{ display: 'flex', width: '100%', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <Typography variant="caption" color="grayDark.main" sx={{ minWidth: 150, paddingTop: 0.25 }}>
              <Timestamp date={new Date(change.at)} variant="minutes" />
            </Typography>
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <Typography variant="body2" color={phrase.warning ? 'warning.main' : undefined} data-history-text>
                <DeviceMention text={phrase.text} deviceId={otherDevice(change)} known={known} />
              </Typography>
              {phrase.detail && (
                <Typography variant="caption" color="grayDark.main" component="div" sx={{ wordBreak: 'break-word' }}>
                  {phrase.detail}
                </Typography>
              )}
              {phrase.raw && expanded && (
                <Typography
                  variant="caption"
                  component="div"
                  data-history-raw
                  sx={{ fontFamily: 'monospace', color: 'grayDark.main', wordBreak: 'break-all' }}
                >
                  {phrase.raw}
                </Typography>
              )}
            </Box>
          </Box>
        )
        return phrase.raw ? (
          <ListItemButton
            key={index}
            disableGutters
            onClick={() => setOpen(expanded ? undefined : index)}
            title={expanded ? t('deviceHistory.hideRaw', 'Hide details') : t('deviceHistory.showRaw', 'Show details')}
          >
            {content}
          </ListItemButton>
        ) : (
          <ListItem key={index} disableGutters>
            {content}
          </ListItem>
        )
      })}
    </List>
    </DeviceSection>
  )
}
