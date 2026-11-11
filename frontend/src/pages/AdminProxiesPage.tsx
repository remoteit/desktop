import React, { useCallback, useEffect, useState } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import {
  Box,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import { UNSUPPORTED } from '../services/graphQLDaemon'
import {
  ExitPolicy,
  ExitPolicyChange,
  graphQLExitPolicy,
  graphQLSetExitPolicy,
  graphQLSetExitSuspended,
} from '../services/graphQLExitPolicy'
import { parsePorts } from '../helpers/portListHelper'
import { AdminProxyLimits } from './AdminProxyLimits'
import { AdminRemoteitExits, AdminRemoteitMachines, AdminRemoteitProxies } from './AdminRemoteit'
import { AdminProxyAccess } from './AdminProxyAccess'
import { AdminTransferUsage } from './AdminTransferUsage'
import { AdminExitFlows } from './AdminExitFlows'
import { adminExitFlowsServed } from '../services/adminExitFlows'
import { ConfirmIconButton } from '../buttons/ConfirmIconButton'
import { InlineTextFieldSetting } from '../components/InlineTextFieldSetting'
import { LoadingMessage } from '../components/LoadingMessage'
import { Container } from '../components/Container'
import { Timestamp } from '../components/Timestamp'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Icon } from '../components/Icon'

export const PROXIES_ROUTE = '/admin/proxies'

export type ProxiesView = 'proxies' | 'exits' | 'machines' | 'access' | 'flows' | 'limits' | 'usage'

const VIEWS: { value: ProxiesView; label: string }[] = [
  { value: 'proxies', label: 'Proxies' },
  { value: 'exits', label: 'Exits' },
  { value: 'machines', label: 'Machines' },
  { value: 'access', label: 'Access log' },
  { value: 'flows', label: 'Exit flows' },
  { value: 'limits', label: 'Limits & policy' },
  { value: 'usage', label: 'Usage' },
]

// The tab is the URL's ?view=, so a link or a reload lands on it; the Proxies tab has none.
export const proxiesView = (search: string): ProxiesView => {
  const view = new URLSearchParams(search).get('view')
  return VIEWS.find(v => v.value === view)?.value ?? 'proxies'
}

/* remote.it's proxies and exits (graphql-api docs/PROXY-GROUPS.md §13, presence-server docs/proxy-plan.md §5, §8), a
   tab each: the proxies, the exits, and the machines that run them (pages/AdminRemoteit.tsx); who used the proxies;
   the flows through the exits, a complaint's address, port and time looked up (pages/AdminExitFlows.tsx), its tab
   only where the API has the lookup; each plan's limits on them, the policy every exit keeps — what it refuses beyond
   what every exit refuses, how fast one account may open flows, how long its flow log and the proxies' access log are
   kept — and the accounts stopped from using exits; and each account's public transfer this month. A change takes effect at once. Admins only; English
   only, as the rest of /admin. */
export const AdminProxiesPage: React.FC = () => {
  const history = useHistory()
  const location = useLocation()
  const view = proxiesView(location.search)
  const [policy, setPolicy] = useState<ExitPolicy | null | 'ERROR' | typeof UNSUPPORTED>()
  const [saving, setSaving] = useState(false)
  const [problem, setProblem] = useState<string>()
  const [flows, setFlows] = useState(false)

  const load = useCallback(async () => setPolicy(await graphQLExitPolicy()), [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    adminExitFlowsServed().then(setFlows)
  }, [])

  const views = VIEWS.filter(v => v.value !== 'flows' || flows || view === 'flows')

  const save = async (change: ExitPolicyChange) => {
    setSaving(true)
    setProblem(undefined)
    if ((await graphQLSetExitPolicy(change)) === 'ERROR') setProblem('The policy was not changed.')
    await load()
    setSaving(false)
  }

  const savePorts = (which: 'blockTcp' | 'blockUdp', text: string) => {
    const ports = parsePorts(text)
    if (!ports) return setProblem(`"${text}" is not a list of ports (1 to 65535).`)
    if (ports.length > 256) return setProblem('At most 256 ports.')
    save({ [which]: ports })
  }

  const saveNumber = (
    which: 'flowsPerSecond' | 'logDays' | 'accessLogDays',
    text: string,
    min: number,
    max: number
  ) => {
    const value = Number(text)
    if (!Number.isInteger(value) || value < min || value > max) return setProblem(`${text} is not ${min} to ${max}.`)
    save({ [which]: value })
  }

  const body = () => {
    // Its own reads, each failing quietly: nothing of the exit policy stands in its way.
    if (view === 'usage') return <AdminTransferUsage />
    if (view === 'flows') return <AdminExitFlows />
    if (policy === undefined) return <LoadingMessage />
    if (policy === UNSUPPORTED)
      return (
        <Notice severity="info" fullWidth>
          This API does not serve Control Link devices, and so has no exit nodes. Point Test Settings → API Target at a
          stage that does (local or dev).
        </Notice>
      )
    if (policy === 'ERROR' || policy === null)
      return (
        <Notice severity="error" fullWidth>
          Could not read the exit policy.
        </Notice>
      )

    return (
      <>
        {problem && (
          <Notice severity="warning" fullWidth onClose={() => setProblem(undefined)}>
            {problem}
          </Notice>
        )}
        {view === 'proxies' && <AdminRemoteitProxies onProblem={setProblem} />}
        {view === 'exits' && <AdminRemoteitExits onProblem={setProblem} />}
        {view === 'machines' && <AdminRemoteitMachines onProblem={setProblem} />}
        {view === 'access' && <AdminProxyAccess />}
        {view === 'limits' && (
          <>
            <List>
              <ListSubheader>Plan limits</ListSubheader>
            </List>
            <AdminProxyLimits />
            <List>
              <ListSubheader>Exit nodes: refused</ListSubheader>
              <InlineTextFieldSetting
                icon="ban"
                label="TCP ports"
                value={policy.blockTcp.join(', ')}
                placeholder="none"
                disabled={saving}
                filter={/[^0-9, ]/g}
                onSave={value => savePorts('blockTcp', String(value))}
              />
              <InlineTextFieldSetting
                icon="ban"
                label="UDP ports"
                value={policy.blockUdp.join(', ')}
                placeholder="none"
                disabled={saving}
                filter={/[^0-9, ]/g}
                onSave={value => savePorts('blockUdp', String(value))}
              />
            </List>
            <Gutters>
              <Typography variant="caption" color="textSecondary">
                Beyond what every exit node refuses: loopback, link-local, multicast, 100.64.0.0/10 and outbound mail
                (TCP 25).
              </Typography>
            </Gutters>
            <List>
              <ListSubheader>Exit nodes: limits</ListSubheader>
              <InlineTextFieldSetting
                icon="gauge-high"
                label="New flows an account may open a second (0, no cap)"
                value={policy.flowsPerSecond}
                disabled={saving}
                filter={/[^0-9]/g}
                onSave={value => saveNumber('flowsPerSecond', String(value), 0, 100000)}
              />
              <InlineTextFieldSetting
                icon="clock-rotate-left"
                label="Days the flow log is kept"
                value={policy.logDays}
                disabled={saving}
                filter={/[^0-9]/g}
                onSave={value => saveNumber('logDays', String(value), 1, 3650)}
              />
            </List>
            {policy.accessLogDays !== undefined && (
              <List>
                <ListSubheader>Proxies: access log</ListSubheader>
                <InlineTextFieldSetting
                  icon="clock-rotate-left"
                  label="Days the access log is kept"
                  value={policy.accessLogDays}
                  disabled={saving}
                  filter={/[^0-9]/g}
                  onSave={value => saveNumber('accessLogDays', String(value), 1, 3650)}
                />
              </List>
            )}
            {policy.updated && (
              <Gutters>
                <Typography variant="caption" color="textSecondary">
                  Last changed <Timestamp date={new Date(policy.updated)} />
                  {policy.updatedBy ? ` by ${policy.updatedBy}` : ''}
                </Typography>
              </Gutters>
            )}
            <Suspensions policy={policy} onChange={load} onProblem={setProblem} />
          </>
        )}
      </>
    )
  }

  return (
    <Container
      integrated
      gutterBottom
      bodyProps={{ verticalOverflow: true }}
      header={
        <Gutters>
          <Typography variant="h1">Proxies &amp; exits</Typography>
          <Tabs value={view} TabIndicatorProps={{ sx: { display: 'none' } }} sx={{ minHeight: 0, marginTop: 1 }}>
            {views.map(v => (
              <Tab
                key={v.value}
                value={v.value}
                label={v.label}
                data-tab={v.value}
                onClick={() =>
                  v.value !== view &&
                  history.push(v.value === 'proxies' ? PROXIES_ROUTE : `${PROXIES_ROUTE}?view=${v.value}`)
                }
              />
            ))}
          </Tabs>
        </Gutters>
      }
    >
      <Gutters size={null}>{body()}</Gutters>
    </Container>
  )
}

type SuspensionsProps = { policy: ExitPolicy; onChange: () => void; onProblem: (problem: string) => void }

// Accounts stopped from using remote.it's exits — a complaint traced to them (remoteit-device exit-node flows) — and
// stopping or letting another. Stopping ends their sessions on every exit at once.
const Suspensions: React.FC<SuspensionsProps> = ({ policy, onChange, onProblem }) => {
  const [accountId, setAccountId] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  const suspend = async (id: string, why: string | null) => {
    setBusy(true)
    if ((await graphQLSetExitSuspended(id, why)) === 'ERROR')
      onProblem(why ? `${id} was not suspended.` : `${id} was not let back.`)
    else if (why) {
      setAccountId('')
      setReason('')
    }
    await onChange()
    setBusy(false)
  }

  const valid = /^[0-9a-f-]{36}$/i.test(accountId.trim()) && reason.trim().length > 0 && reason.length <= 1024

  return (
    <>
      <List>
        <ListSubheader>Suspended accounts</ListSubheader>
        {!policy.suspensions.length && (
          <ListItem>
            <ListItemText secondary="None: every account whose plan gives exits may use them." />
          </ListItem>
        )}
        {policy.suspensions.map(s => (
          <ListItem
            key={s.accountId}
            secondaryAction={
              <ConfirmIconButton
                icon="unlock"
                title="Let use exits again"
                disabled={busy}
                confirm
                confirmProps={{
                  title: 'Let this account use exits again?',
                  children: `${s.accountId} may use remote.it's exit nodes again, as its plan gives them.`,
                }}
                onClick={() => suspend(s.accountId, null)}
              />
            }
          >
            <ListItemIcon>
              <Icon name="user-slash" size="md" />
            </ListItemIcon>
            <ListItemText
              primary={s.accountId}
              secondary={
                <>
                  {s.reason} · <Timestamp date={new Date(s.suspended)} /> by {s.suspendedBy}
                </>
              }
            />
          </ListItem>
        ))}
      </List>
      <Gutters>
        <Box display="flex" flexDirection="column" gap={1}>
          <TextField size="small" label="Account ID" value={accountId} onChange={e => setAccountId(e.target.value)} />
          <TextField
            size="small"
            label="Reason"
            value={reason}
            onChange={e => setReason(e.target.value)}
            inputProps={{ maxLength: 1024 }}
          />
          <Box>
            <Button
              variant="contained"
              size="small"
              color="error"
              disabled={busy || !valid}
              onClick={() => suspend(accountId.trim(), reason.trim())}
            >
              Suspend from exits
            </Button>
          </Box>
          <Typography variant="caption" color="textSecondary">
            Its sessions on every exit end now, and it is refused new ones until let back.
          </Typography>
        </Box>
      </Gutters>
    </>
  )
}
