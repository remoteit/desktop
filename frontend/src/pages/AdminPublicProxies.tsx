import React, { useCallback, useEffect, useState } from 'react'
import {
  Box,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
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
import { ListItemSetting } from '../components/ListItemSetting'
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

const PublicProxy: React.FC<RowProps> = ({ device: d, busy, change }) => {
  const proxy = d.proxy!
  return (
    <>
      <ListItem
        secondaryAction={
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
        }
      >
        <ListItemIcon>
          <Icon name="server" size="md" color={online(d) ? 'primary' : 'grayDark'} />
        </ListItemIcon>
        <ListItemText
          primary={`${proxy.host} · ${proxy.region ?? 'no region'} · ${d.endpoints} endpoint${
            d.endpoints === 1 ? '' : 's'
          }`}
          secondary={about(d)}
        />
      </ListItem>
      {!d.system && (
        <ListItem
          secondaryAction={
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
          }
        >
          <ListItemIcon>
            <Icon name="triangle-exclamation" size="md" color="warning" />
          </ListItemIcon>
          <ListItemText
            primary={`In ${d.owner ?? 'another'} account`}
            secondary="A public proxy is remote.it's: moved, its shares end, and its owner no longer sees it."
          />
        </ListItem>
      )}
      <ListItemSetting
        icon="right-from-bracket"
        label="Public exit"
        subLabel="An exit for everyone whose plan gives exits, under the policy below"
        toggle={proxy.publicExit}
        disabled={busy}
        confirm={proxy.publicExit}
        confirmProps={{
          title: `Stop ${proxy.host} being a public exit?`,
          children: 'Everyone using it as their exit is moved off it.',
        }}
        onClick={() =>
          change(
            d.id,
            () => graphQLSetProxyPublicExit(d.id, !proxy.publicExit),
            `${proxy.host}'s exit was not changed.`
          )
        }
      />
    </>
  )
}

// A device the proxy code registered, made a public proxy once it is given its region (an AWS region's name, as the
// proxies nearest a device are chosen by: us-west-2, eu-west-1…). It takes the next free name, e<n>.
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
