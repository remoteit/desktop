import React, { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Button,
  Link,
  List,
  ListSubheader,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import {
  DEFAULTS,
  ExitFlow,
  ExitFlowsFound,
  LATER_HOURS,
  LIMITS,
  WITHIN_MINUTES,
  adminExitFlowsServed,
  fetchAdminExitFlows,
  flowOpener,
} from '../services/adminExitFlows'
import { graphQLRemoteitMachines } from '../services/graphQLRemoteit'
import { humanizeDuration } from '../helpers/dateHelper'
import { formatBytes } from '../helpers/usageHelper'
import { LoadingMessage } from '../components/LoadingMessage'
import { Timestamp } from '../components/Timestamp'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'

export const PAGE_SIZE = 50

// `datetime-local` takes `YYYY-MM-DDTHH:mm` in local time.
export const localInputValue = (date: Date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)

type Form = { at: string; address: string; port: string; withinMinutes: number; laterHours: number; limit: number }

// What narrows the flows found, each by ID: one exit's, one account's, one client device's, one person's.
type Narrow = { exit: string; account: string; client: string; person: string }

const EVERY: Narrow = { exit: '', account: '', client: '', person: '' }

type Result = ExitFlowsFound | { reason: string } | 'ERROR' | 'loading'

const port = (text: string) => (/^\d+$/.test(text.trim()) ? Number(text) : NaN)

// Ready to look up: a time, and an address, a port in range, or both. What else is wrong graphql says.
export const lookupReady = (form: Form) => {
  const p = form.port.trim() ? port(form.port) : undefined
  if (p !== undefined && !(p >= 1 && p <= 65535)) return false
  if (!form.address.trim() && p === undefined) return false
  return !Number.isNaN(new Date(form.at).getTime())
}

const narrows = (flow: ExitFlow, narrow: Narrow) =>
  (!narrow.exit || flow.exitId === narrow.exit) &&
  (!narrow.account || flow.accountId === narrow.account) &&
  (!narrow.client || flow.clientId === narrow.client) &&
  (!narrow.person || flow.personId === narrow.person)

// The values of one of a flow's IDs among those found, each once, by its label.
function choices(
  flows: ExitFlow[],
  id: (flow: ExitFlow) => string | null | undefined,
  label: (flow: ExitFlow) => string
) {
  const seen = new Map<string, string>()
  for (const flow of flows) {
    const key = id(flow)
    if (key && !seen.has(key)) seen.set(key, label(flow))
  }
  return [...seen].map(([key, name]) => ({ key, name })).sort((a, b) => a.name.localeCompare(b.name))
}

/* The flows through remote.it's public exits (services/adminExitFlows), on Admin → Proxies & exits: a complaint's
   address, port, or both and its time looked up across every exit, gone ones too, each flow found with the exit, the
   client device, the account charged, the OS account and person on the client that opened it, its destination, how
   long it lasted and what it carried. graphql narrows by nothing else, so the flows found are narrowed here — by exit,
   account, device or person — and shown a page at a time. A lookup runs only when asked: graphql logs each one.
   Admins only; English only, as the rest of /admin. */
export const AdminExitFlows: React.FC = () => {
  const [served, setServed] = useState<boolean>()
  const [form, setForm] = useState<Form>(() => ({
    at: localInputValue(new Date()),
    address: '',
    port: '',
    ...DEFAULTS,
  }))
  const [result, setResult] = useState<Result>()
  const [narrow, setNarrow] = useState<Narrow>(EVERY)
  const [page, setPage] = useState(0)
  const [exits, setExits] = useState<ILookup<string>>({})

  useEffect(() => {
    adminExitFlowsServed().then(setServed)
    graphQLRemoteitMachines().then(machines => {
      if (Array.isArray(machines))
        setExits(Object.fromEntries(machines.filter(m => m.name).map(m => [m.id, m.name as string])))
    })
  }, [])

  // One at a time: Find flows waits for the answer.
  const lookUp = async () => {
    setResult('loading')
    setNarrow(EVERY)
    setPage(0)
    const found = await fetchAdminExitFlows({
      at: new Date(form.at),
      address: form.address.trim() || undefined,
      port: form.port.trim() ? port(form.port) : undefined,
      withinMinutes: form.withinMinutes,
      laterHours: form.laterHours,
      limit: form.limit,
    }).catch(() => 'ERROR' as const)
    setResult(found === 'UNSUPPORTED' ? 'ERROR' : found)
  }

  if (served === undefined) return <LoadingMessage />
  if (!served)
    return (
      <Notice severity="info" fullWidth>
        This API has no exit flow lookup. Point Test Settings → API Target at a stage whose graphql has adminExitFlows.
      </Notice>
    )

  const set = (change: Partial<Form>) => setForm(f => ({ ...f, ...change }))

  return (
    <>
      <List>
        <ListSubheader>Exit flows</ListSubheader>
      </List>
      <Gutters>
        <Typography variant="caption" color="textSecondary" component="p" gutterBottom>
          The flows through remote.it's public exits, gone ones too, from one of our addresses, a port, or both, open
          around a time. Each lookup is logged with who asked.
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <TextField
            size="small"
            label="Address"
            placeholder="203.0.113.7"
            value={form.address}
            onChange={e => set({ address: e.target.value })}
            inputProps={{ 'data-choice': 'address' }}
          />
          <TextField
            size="small"
            label="Port"
            value={form.port}
            sx={{ width: 100 }}
            onChange={e => set({ port: e.target.value.replace(/[^0-9]/g, '') })}
            inputProps={{ 'data-choice': 'port', inputMode: 'numeric' }}
          />
          <TextField
            size="small"
            type="datetime-local"
            label="Around"
            value={form.at}
            InputLabelProps={{ shrink: true }}
            onChange={e => set({ at: e.target.value })}
            inputProps={{ 'data-choice': 'at' }}
          />
          <TextField
            select
            size="small"
            label="Either side"
            value={form.withinMinutes}
            sx={{ minWidth: 120 }}
            onChange={e => set({ withinMinutes: Number(e.target.value) })}
            inputProps={{ 'data-choice': 'within' }}
          >
            {WITHIN_MINUTES.map(minutes => (
              <MenuItem key={minutes} value={minutes}>
                {minutes < 60 ? `${minutes} minutes` : `${minutes / 60} hour${minutes === 60 ? '' : 's'}`}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Ended up to"
            value={form.laterHours}
            sx={{ minWidth: 140 }}
            onChange={e => set({ laterHours: Number(e.target.value) })}
            inputProps={{ 'data-choice': 'later' }}
          >
            {LATER_HOURS.map(hours => (
              <MenuItem key={hours} value={hours}>
                {hours ? `${hours} hour${hours === 1 ? '' : 's'} later` : 'Within the window'}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="At most"
            value={form.limit}
            sx={{ minWidth: 100 }}
            onChange={e => set({ limit: Number(e.target.value) })}
            inputProps={{ 'data-choice': 'limit' }}
          >
            {LIMITS.map(limit => (
              <MenuItem key={limit} value={limit}>
                {limit} flows
              </MenuItem>
            ))}
          </TextField>
          <Button
            variant="contained"
            size="small"
            disabled={!lookupReady(form) || result === 'loading'}
            onClick={lookUp}
            data-testid="look-up"
          >
            Find flows
          </Button>
        </Stack>
      </Gutters>
      <Found result={result} narrow={narrow} page={page} exits={exits} onNarrow={setNarrow} onPage={setPage} />
    </>
  )
}

type FoundProps = {
  result?: Result
  narrow: Narrow
  page: number
  exits: ILookup<string>
  onNarrow: (narrow: Narrow) => void
  onPage: (page: number) => void
}

const Found: React.FC<FoundProps> = ({ result, narrow, page, exits, onNarrow, onPage }) => {
  if (result === undefined)
    return <Quiet testId="flows-unasked">Name an address, a port, or both, and a time, then find the flows.</Quiet>
  if (result === 'loading') return <LoadingMessage />
  if (result === 'ERROR') return <Quiet testId="flows-error">The flows could not be read.</Quiet>
  if ('reason' in result)
    return (
      <Notice severity="warning" fullWidth>
        <span data-testid="flows-refused">{result.reason || 'The lookup was refused.'}</span>
      </Notice>
    )

  const exitName = (flow: ExitFlow) => exits[flow.exitId] || flow.exitId
  const shown = result.flows.filter(flow => narrows(flow, narrow))
  const pages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE))
  const at = Math.min(page, pages - 1)
  const rows = shown.slice(at * PAGE_SIZE, (at + 1) * PAGE_SIZE)
  const narrowers: { key: keyof Narrow; label: string; values: { key: string; name: string }[] }[] = [
    { key: 'exit' as const, label: 'Exit', values: choices(result.flows, f => f.exitId, exitName) },
    {
      key: 'account' as const,
      label: 'Account',
      values: choices(
        result.flows,
        f => f.accountId,
        f => f.accountEmail || (f.accountId as string)
      ),
    },
    {
      key: 'client' as const,
      label: 'Device',
      values: choices(
        result.flows,
        f => f.clientId,
        f => f.clientId as string
      ),
    },
    {
      key: 'person' as const,
      label: 'Person',
      values: choices(
        result.flows,
        f => f.personId,
        f => f.personEmail || (f.personId as string)
      ),
    },
  ].filter(each => each.values.length > 1 || narrow[each.key])

  return (
    <>
      <Gutters>
        <Typography variant="caption" color="textSecondary" component="p" data-testid="flows-window">
          {result.flows.length === 1 ? '1 flow' : `${result.flows.length} flows`} open between{' '}
          {result.from ? <Timestamp date={new Date(result.from)} /> : '?'} and{' '}
          {result.to ? <Timestamp date={new Date(result.to)} /> : '?'}
        </Typography>
      </Gutters>
      {result.truncated && (
        <Notice severity="warning" fullWidth>
          <span data-testid="flows-truncated">
            More flows matched than these, or more of the log than one lookup reads: narrow the window or name both an
            address and a port, or raise the limit.
          </span>
        </Notice>
      )}
      {!!narrowers.length && (
        <Gutters>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            {narrowers.map(each => (
              <TextField
                key={each.key}
                select
                size="small"
                label={each.label}
                value={narrow[each.key]}
                sx={{ minWidth: 160 }}
                onChange={e => {
                  onNarrow({ ...narrow, [each.key]: e.target.value })
                  onPage(0)
                }}
                inputProps={{ 'data-narrow': each.key }}
              >
                <MenuItem value="">Every one</MenuItem>
                {each.values.map(value => (
                  <MenuItem key={value.key} value={value.key}>
                    {value.name}
                  </MenuItem>
                ))}
              </TextField>
            ))}
          </Stack>
        </Gutters>
      )}
      {!result.flows.length ? (
        <Quiet testId="flows-empty">No flow matched in that window.</Quiet>
      ) : !shown.length ? (
        <Quiet testId="flows-narrowed-empty">None of the flows found matches.</Quiet>
      ) : (
        <>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small" data-testid="flows">
              <TableHead>
                <TableRow>
                  <TableCell>Time</TableCell>
                  <TableCell>Exit</TableCell>
                  <TableCell>Client device</TableCell>
                  <TableCell>Account charged</TableCell>
                  <TableCell>OS account &amp; person</TableCell>
                  <TableCell>Destination</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Bytes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((flow, index) => (
                  <FlowRow
                    key={`${flow.exitId}|${flow.start}|${flow.destination}|${index}`}
                    flow={flow}
                    exitName={exitName(flow)}
                  />
                ))}
              </TableBody>
            </Table>
          </Box>
          {pages > 1 && (
            <Gutters>
              <Stack direction="row" spacing={1} alignItems="center">
                <Button size="small" disabled={at === 0} onClick={() => onPage(at - 1)} data-testid="flows-previous">
                  Previous
                </Button>
                <Typography variant="caption" color="textSecondary" data-testid="flows-page">
                  {at * PAGE_SIZE + 1}–{at * PAGE_SIZE + rows.length} of {shown.length}
                </Typography>
                <Button size="small" disabled={at >= pages - 1} onClick={() => onPage(at + 1)} data-testid="flows-next">
                  Next
                </Button>
              </Stack>
            </Gutters>
          )}
        </>
      )}
    </>
  )
}

// One flow. The exit says the address and port the internet saw beneath it: what a complaint names.
const FlowRow: React.FC<{ flow: ExitFlow; exitName: string }> = ({ flow, exitName }) => {
  const opener = flowOpener(flow)
  const lasted = new Date(flow.end).getTime() - new Date(flow.start).getTime()
  return (
    <TableRow data-flow={flow.exitId}>
      <TableCell>
        <Timestamp date={new Date(flow.start)} />
      </TableCell>
      <TableCell data-cell="exit">
        <Link component={RouterLink} to={`/admin/devices/${flow.exitId}`}>
          {exitName}
        </Link>
        {flow.address && (
          <Typography variant="caption" color="textSecondary" component="p">
            {flow.address}
            {flow.port ? `:${flow.port}` : ''}
          </Typography>
        )}
      </TableCell>
      <TableCell data-cell="client">
        {flow.clientId ? (
          <Link component={RouterLink} to={`/admin/devices/${flow.clientId}`}>
            {flow.clientId}
          </Link>
        ) : (
          '—'
        )}
      </TableCell>
      <TableCell data-cell="account">
        {flow.accountId ? (
          <Link component={RouterLink} to={`/admin/users/${flow.accountId}`}>
            {flow.accountEmail || flow.accountId}
          </Link>
        ) : (
          '—'
        )}
      </TableCell>
      <TableCell data-cell="opener">{opener ?? '—'}</TableCell>
      <TableCell data-cell="destination">
        {flow.proto ? `${flow.proto} ` : ''}
        {flow.destination}
      </TableCell>
      <TableCell data-cell="duration">
        {Number.isFinite(lasted) && lasted >= 0 ? humanizeDuration(lasted, { largest: 2, round: true }) : '—'}
      </TableCell>
      <TableCell data-cell="bytes">
        {formatBytes(flow.up)} up · {formatBytes(flow.down)} down
      </TableCell>
    </TableRow>
  )
}

const Quiet: React.FC<{ testId: string; children: React.ReactNode }> = ({ testId, children }) => (
  <Gutters>
    <Typography variant="caption" color="textSecondary" data-testid={testId}>
      {children}
    </Typography>
  </Gutters>
)
