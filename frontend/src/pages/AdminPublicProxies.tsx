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
  graphQLRemoteitProxyCode,
  graphQLRemoteitProxyDevices,
  graphQLRemoveRemoteitProxy,
  graphQLSetProxyPublicExit,
  graphQLSetRemoteitProxy,
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
   endpoints, and whether it is also a public exit — switched here, apart from its being a proxy. A public proxy's
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

// One row a proxy: its name, region and endpoints, the device under them (and whose account it is in, when it is not
// remote.it's yet); at its end, moving it to remote.it when it needs to be, renaming one with a bare e<n> to e<n>-r3,
// whether it is a public exit, and stopping it.
const PublicProxy: React.FC<RowProps> = ({ device: d, busy, change }) => {
  const proxy = d.proxy!
  const [confirmExitOff, setConfirmExitOff] = useState(false)
  const [confirmRename, setConfirmRename] = useState(false)
  const bare = proxy.region ? bareRemoteitNumber(proxy.host) : undefined
  const setExit = (on: boolean) =>
    change(d.id, () => graphQLSetProxyPublicExit(d.id, on), `${proxy.host}'s exit was not changed.`)

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
          <FormControlLabel
            label={<Typography variant="caption">Public exit</Typography>}
            labelPlacement="start"
            title="An exit for everyone whose plan gives exits, under the policy below"
            control={
              <Switch
                size="small"
                checked={proxy.publicExit}
                disabled={busy}
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
        <Icon name="server" size="md" color={online(d) ? 'primary' : 'grayDark'} />
      </ListItemIcon>
      <ListItemText
        primary={`${proxy.host} · ${proxy.region ?? 'no region'} · ${d.endpoints} endpoint${
          d.endpoints === 1 ? '' : 's'
        }`}
        secondary={
          <>
            {about(d)}
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
// proxies nearest a device are chosen by: us-west-2, eu-west-1…). It takes the next free name, e<n>-r3.
const Waiting: React.FC<RowProps> = ({ device: d, busy, change }) => {
  const [region, setRegion] = useState('')
  const valid = /^[a-z]{2}(-[a-z]+)+-\d$/.test(region.trim())
  return (
    <ListItem>
      <ListItemIcon>
        <Icon name="server" size="md" color={online(d) ? 'primary' : 'grayDark'} />
      </ListItemIcon>
      <ListItemText primary={d.name ?? d.id} secondary={about(d)} />
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
