import React, { useCallback, useEffect, useState } from 'react'
import {
  Box,
  Button,
  FormControlLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { UNSUPPORTED } from '../services/graphQLDaemon'
import {
  graphQLAdoptRemoteitProxy,
  graphQLDrainProxy,
  graphQLRemoteitProxyCode,
  graphQLRemoteitProxyDevices,
  graphQLRemoveRemoteitProxy,
  graphQLRetireProxy,
  graphQLSetProxyPublicExit,
  graphQLSetRemoteitProxy,
  graphQLUndrainProxy,
  RemoteitProxyDevice,
} from '../services/graphQLProxy'
import { ConfirmIconButton } from '../buttons/ConfirmIconButton'
import { Confirm } from '../components/Confirm'
import { LoadingMessage } from '../components/LoadingMessage'
import { CopyCodeBlock } from '../components/CopyCodeBlock'
import { Timestamp } from '../components/Timestamp'
import { Gutters } from '../components/Gutters'
import { Icon } from '../components/Icon'

/* remote.it's proxies (presence-server docs/proxy-plan.md §5): each by its name and region, online or not, its
   endpoints and the connections open through it, its state (graphql-api docs/PROXY-DRAIN.md) — active; draining,
   taking nothing new while it serves what it has, with whether it is safe to stop; or retired, serving nothing — with
   Drain, Undrain and Retire, and whether it is also a public exit — switched here, apart from its being a proxy. A
   new one starts retired. A public proxy's
   device is remote.it's (its system account's, graphql services/remoteit-proxies.ts), never a person's: a new one
   installs with the proxy registration code and waits here for its region; one made before that, still in someone's
   account, is moved to remote.it here. Stopping one removes everyone's endpoints on it. */
export const AdminPublicProxies: React.FC<{ onProblem: (problem: string) => void }> = ({ onProblem }) => {
  const [devices, setDevices] = useState<RemoteitProxyDevice[] | 'ERROR' | typeof UNSUPPORTED>()
  const [busy, setBusy] = useState<string>()

  const load = useCallback(async () => setDevices(await graphQLRemoteitProxyDevices()), [])

  useEffect(() => {
    load()
  }, [load])

  // While one drains, read again every half minute, so its open connections and safe to stop move on by themselves.
  const draining = Array.isArray(devices) && devices.some(d => d.proxy?.state === 'DRAINING')
  useEffect(() => {
    if (!draining) return
    const timer = setInterval(load, 30_000)
    return () => clearInterval(timer)
  }, [draining, load])

  const change = async (id: string, run: () => Promise<unknown>, failed: string) => {
    setBusy(id)
    if ((await run()) === 'ERROR') onProblem(failed)
    await load()
    setBusy(undefined)
  }

  if (devices === undefined) return <LoadingMessage />
  if (!Array.isArray(devices)) return null // the page above says why: no device sessions, or no reading them

  const proxies = devices.filter(d => d.proxy)
  const waiting = devices.filter(d => !d.proxy)

  return (
    <>
      <List>
        <ListSubheader>Public proxies</ListSubheader>
        {!proxies.length && (
          <ListItem>
            <ListItemText secondary="None yet: install a device with the registration code below." />
          </ListItem>
        )}
        {proxies.map(d => (
          <PublicProxy key={d.id} device={d} busy={!!busy} change={change} />
        ))}
      </List>
      {!!waiting.length && (
        <List>
          <ListSubheader>Registered, waiting for a region</ListSubheader>
          {waiting.map(d => (
            <Waiting key={d.id} device={d} busy={!!busy} change={change} />
          ))}
        </List>
      )}
      <RegistrationCode onProblem={onProblem} />
    </>
  )
}

type RowProps = {
  device: RemoteitProxyDevice
  busy: boolean
  change: (id: string, run: () => Promise<unknown>, failed: string) => Promise<void>
}

const online = (d: RemoteitProxyDevice) => d.state === 'active' || d.state === 'connected'

// What the device is: its name, whether it is online (or when it was last), and its id.
const about = (d: RemoteitProxyDevice) => (
  <>
    {d.name ?? 'no such device'} · {online(d) ? 'online' : 'offline'}
    {!online(d) && d.lastReported && (
      <>
        {' '}
        since <Timestamp date={new Date(d.lastReported)} />
      </>
    )}{' '}
    · {d.id}
  </>
)

// A proxy named before remote.it's had its slug: its bare e<n> host's number, to move it to e<n>-r3 (graphql
// setRemoteitProxy with the number). None for one named e<n>-r3 already.
export const bareRemoteitNumber = (host: string) => {
  const n = /^e(\d+)\./.exec(host)?.[1]
  return n ? Number(n) : undefined
}

// What draining leaves running: the connections open through it, which the confirmation says before it drains.
export const drainHint = (open: number) =>
  open === 0
    ? 'No connections are open through it now; it takes no new ones.'
    : open === 1
    ? '1 open connection keeps running until it closes; it takes no new ones.'
    : `${open} open connections keep running until they close; it takes no new ones.`

// The connections open through it: its daemon's count, or, from a daemon that does not say it, the sessions graphql knows.
export const openCount = (d: RemoteitProxyDevice) => d.openConnections?.total ?? d.openSessions

// What the row says after its counts: nothing while active; draining, whether it is safe to stop and why; retired.
export const stateLabel = (d: RemoteitProxyDevice) => {
  const state = d.proxy?.state
  if (state === 'RETIRED') return ' · retired'
  if (state !== 'DRAINING') return ''
  if (!d.drain) return ' · draining…'
  return d.drain.safeToStop ? ` · draining — safe to stop (${d.drain.reason})` : ` · draining — wait: ${d.drain.reason}`
}

export const DEFAULT_MAX_WAIT = 60

// One row a proxy: its name, region, endpoints and open connections, its state and whether it is safe to stop, the
// device under them (and whose account it is in, when it is not remote.it's yet), greyed unless active; at its end,
// moving it to remote.it when it needs to be, renaming one with a bare e<n> to e<n>-r3, Drain / Undrain / Retire, whether
// it is a public exit (no exit unless active), and stopping it being a proxy.
const PublicProxy: React.FC<RowProps> = ({ device: d, busy, change }) => {
  const proxy = d.proxy!
  const [confirmExitOff, setConfirmExitOff] = useState(false)
  const [confirmDrain, setConfirmDrain] = useState(false)
  const [confirmRetire, setConfirmRetire] = useState(false)
  const [confirmRename, setConfirmRename] = useState(false)
  const [maxWait, setMaxWait] = useState(String(DEFAULT_MAX_WAIT))
  const bare = proxy.region ? bareRemoteitNumber(proxy.host) : undefined
  const active = proxy.state === 'ACTIVE'
  const open = openCount(d)
  const wait = Number(maxWait)
  const waitValid = Number.isInteger(wait) && wait >= 1 && wait <= 7 * 24 * 60
  const setExit = (on: boolean) =>
    change(d.id, () => graphQLSetProxyPublicExit(d.id, on), `${proxy.host}'s exit was not changed.`)
  const drain = () => change(d.id, () => graphQLDrainProxy(d.id, wait), `${proxy.host} was not drained.`)
  const undrain = () => change(d.id, () => graphQLUndrainProxy(d.id), `${proxy.host} was not put back in service.`)
  // Retired when safe; otherwise asked first, and then forced: what is still open is dropped.
  const retire = (force: boolean) =>
    change(
      d.id,
      () => graphQLRetireProxy(d.id, force),
      `${proxy.host} was not retired${force ? '' : ': connections are still open through it'}.`
    )

  return (
    <ListItem
      secondaryAction={
        <Box display="flex" alignItems="center" gap={1}>
          {!d.system && (
            <Button
              size="small"
              variant="contained"
              disabled={busy}
              onClick={() =>
                change(d.id, () => graphQLAdoptRemoteitProxy(d.id), `${proxy.host} was not moved to remote.it.`)
              }
            >
              Move to remote.it
            </Button>
          )}
          {bare !== undefined && (
            <Button size="small" variant="contained" disabled={busy} onClick={() => setConfirmRename(true)}>
              Rename e{bare}-r3
            </Button>
          )}
          {active && (
            <Button size="small" variant="outlined" disabled={busy} onClick={() => setConfirmDrain(true)}>
              Drain
            </Button>
          )}
          {!active && (
            <Button size="small" variant="outlined" disabled={busy} onClick={undrain}>
              Undrain
            </Button>
          )}
          {proxy.state !== 'RETIRED' && (
            <Button
              size="small"
              variant={d.drain?.safeToStop ? 'contained' : 'outlined'}
              disabled={busy}
              onClick={() => (d.drain?.safeToStop ? retire(false) : setConfirmRetire(true))}
            >
              Retire
            </Button>
          )}
          <FormControlLabel
            label={<Typography variant="caption">Public exit</Typography>}
            labelPlacement="start"
            title={
              active
                ? 'An exit for everyone whose plan gives exits, under the policy below'
                : 'No exit unless the proxy is in service'
            }
            control={
              <Switch
                size="small"
                checked={proxy.publicExit}
                disabled={busy || !active}
                onChange={() => (proxy.publicExit ? setConfirmExitOff(true) : setExit(true))}
              />
            }
          />
          <ConfirmIconButton
            icon="trash"
            title="Stop being a public proxy"
            disabled={busy}
            confirm
            confirmProps={{
              title: `Stop ${proxy.host} being a public proxy?`,
              children: "Everyone's endpoints on it are removed, and it is no longer anyone's exit.",
            }}
            onClick={() => change(d.id, () => graphQLRemoveRemoteitProxy(d.id), `${proxy.host} was not removed.`)}
          />
          <Confirm
            open={confirmExitOff}
            title={`Stop ${proxy.host} being a public exit?`}
            onConfirm={() => {
              setConfirmExitOff(false)
              setExit(false)
            }}
            onDeny={() => setConfirmExitOff(false)}
          >
            Everyone using it as their exit is moved off it.
          </Confirm>
          <Confirm
            open={confirmDrain}
            title={`Drain ${proxy.host}?`}
            disabled={!waitValid}
            onConfirm={() => {
              setConfirmDrain(false)
              drain()
            }}
            onDeny={() => setConfirmDrain(false)}
          >
            {drainHint(open)} geo stops sending people to it at once, and it is no one's exit until it is undrained. Its
            endpoints and connect links keep working while it drains. This page says when it is safe to stop: nothing
            open, DNS caches clear and no temporary endpoint left to use — or the max wait over. Then stop its instance
            and retire it.
            <TextField
              size="small"
              type="number"
              label="Max wait (minutes)"
              value={maxWait}
              error={!waitValid}
              onChange={e => setMaxWait(e.target.value)}
              sx={{ display: 'block', marginTop: 2 }}
            />
          </Confirm>
          <Confirm
            open={confirmRetire}
            title={`Retire ${proxy.host} anyway?`}
            onConfirm={() => {
              setConfirmRetire(false)
              retire(true)
            }}
            onDeny={() => setConfirmRetire(false)}
          >
            It is not safe to stop yet{d.drain ? `: ${d.drain.reason}` : active ? ': it is in service — drain it first' : ''}.
            Retired, it serves nothing: {open === 1 ? 'the 1 connection' : `the ${open} connections`} open through it
            {open === 1 ? ' is' : ' are'} dropped, its temporary endpoints and connect links go, and its permanent
            endpoints stop working until it is undrained.
          </Confirm>
          <Confirm
            open={confirmRename}
            title={`Rename ${proxy.host} to e${bare}-r3?`}
            onConfirm={() => {
              setConfirmRename(false)
              change(d.id, () => graphQLSetRemoteitProxy(d.id, proxy.region!, bare), `${proxy.host} was not renamed.`)
            }}
            onDeny={() => setConfirmRename(false)}
          >
            Its certificate is issued again for the new name by the certificate job — https on it fails until then — and
            its endpoints and links move from names under {proxy.host} to names under e{bare}-r3. DNS for e{bare}-r3 and
            *.e{bare}-r3 must be in place first. The geo names do not change.
          </Confirm>
        </Box>
      }
    >
      <ListItemIcon>
        <Icon name="server" size="md" color={online(d) && active ? 'primary' : 'grayDark'} />
      </ListItemIcon>
      <ListItemText
        sx={active ? undefined : { opacity: 0.6 }}
        primary={`${proxy.host} · ${proxy.region ?? 'no region'} · ${d.endpoints} endpoint${
          d.endpoints === 1 ? '' : 's'
        } · ${open} open${stateLabel(d)}`}
        secondary={
          <>
            {about(d)}
            {d.openConnections && (
              <Typography component="span" variant="caption" display="block">
                https {d.openConnections.https} · tcp {d.openConnections.tcp} · udp {d.openConnections.udp}
              </Typography>
            )}
            {!d.system && (
              <Typography component="span" variant="caption" color="warning.main" display="block">
                In {d.owner ?? 'another'} account: move it, and its shares end and its owner no longer sees it.
              </Typography>
            )}
          </>
        }
      />
    </ListItem>
  )
}

// A device the proxy code registered, made a public proxy once it is given its region (an AWS region's name, as the
// proxies nearest a device are chosen by: us-west-2, eu-west-1…). It takes the next free name, e<n>-r3, and starts
// retired: undrained above once it is ready to take people.
const Waiting: React.FC<RowProps> = ({ device: d, busy, change }) => {
  const [region, setRegion] = useState('')
  const valid = /^[a-z]{2}(-[a-z]+)+-\d$/.test(region.trim())
  return (
    <ListItem>
      <ListItemIcon>
        <Icon name="server" size="md" color={online(d) ? 'primary' : 'grayDark'} />
      </ListItemIcon>
      <ListItemText
        primary={d.name ?? d.id}
        secondary={
          <>
            {about(d)}
            <Typography component="span" variant="caption" display="block">
              Made a public proxy, it starts retired: undrain it once it is ready.
            </Typography>
          </>
        }
      />
      <Box display="flex" gap={1} alignItems="center" marginLeft={2}>
        <TextField
          size="small"
          label="Region"
          placeholder="us-west-2"
          value={region}
          onChange={e => setRegion(e.target.value)}
        />
        <Button
          size="small"
          variant="contained"
          disabled={busy || !valid}
          onClick={() =>
            change(d.id, () => graphQLSetRemoteitProxy(d.id, region.trim()), `${d.name ?? d.id} was not made a proxy.`)
          }
        >
          Make public proxy
        </Button>
      </Box>
    </ListItem>
  )
}

// The proxy registration code, shown only when asked: it puts a device in remote.it's account.
const RegistrationCode: React.FC<{ onProblem: (problem: string) => void }> = ({ onProblem }) => {
  const [code, setCode] = useState<string>()
  const [asking, setAsking] = useState(false)

  const show = async () => {
    setAsking(true)
    const result = await graphQLRemoteitProxyCode()
    if (result === 'ERROR') onProblem('Could not get the proxy registration code.')
    else setCode(result)
    setAsking(false)
  }

  return (
    <List>
      <ListSubheader>Add a public proxy</ListSubheader>
      <Gutters>
        {code ? (
          <CopyCodeBlock value={code} label="Proxy registration code" />
        ) : (
          <Button size="small" variant="contained" disabled={asking} onClick={show}>
            Show the registration code
          </Button>
        )}
        <Typography variant="caption" color="textSecondary" component="p" marginTop={1}>
          Install the device package with this code: the device registers into remote.it's account, not yours, and
          appears above waiting for its region. Keep it secret: anyone with it can add a device to remote.it's account.
        </Typography>
      </Gutters>
    </List>
  )
}
