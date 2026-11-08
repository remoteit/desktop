import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material'
import { UNSUPPORTED } from '../services/graphQLDaemon'
import { refusalOf } from '../services/graphQL'
import { DeviceRuns, graphQLAddExitDevice, graphQLAddProxyDevice } from '../services/graphQLDeviceRuns'
import { graphQLSetExitActivation } from '../services/graphQLExits'
import { graphQLSetProxyActivation } from '../services/graphQLProxy'
import {
  Location,
  RemoteitMachine,
  Renumbered,
  graphQLAdoptRemoteitProxy,
  graphQLCreateRemoteit,
  graphQLRemoteitExits,
  graphQLRemoteitMachines,
  graphQLRemoteitProxies,
  graphQLRemoteitProxyCode,
  graphQLRenumberProxyDevice,
} from '../services/graphQLRemoteit'
import { Confirm } from '../components/Confirm'
import { lanAddWarning, runStateLabel, stillRunsLine } from '../helpers/runsHelper'
import { RunListItem } from '../components/RunListItem'
import { RunActions } from '../components/RunActions'
import { SelectSetting } from '../components/SelectSetting'
import { LoadingMessage } from '../components/LoadingMessage'
import { CopyCodeBlock } from '../components/CopyCodeBlock'
import { Timestamp } from '../components/Timestamp'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Icon } from '../components/Icon'

/* remote.it's proxies and exits, for its admins (graphql-api docs/PROXY-GROUPS.md §13): two kinds at a location each —
   the pdx1a proxy and the pdx1a exit — run by the same machines, remote.it's devices. A tab each: the proxies, the exits,
   and the machines. A proxy's or an exit's page lists the machines running it, each with its state there and its
   actions in it alone (saying first what each does), adds a machine to it, sets its activation, and makes a new one at
   a location. The machines' page shows everything each runs, with the actions on all of it at once — each saying first
   what it does to each proxy and exit — so taking a machine down never surprises; a machine still in someone's account
   is moved to remote.it, and the registration code a new machine installs with is shown when asked. English only, as
   the rest of /admin. */

type Problem = (problem: string) => void
type Proxies = Exclude<Awaited<ReturnType<typeof graphQLRemoteitProxies>>, 'ERROR' | typeof UNSUPPORTED>
type Exits = Exclude<Awaited<ReturnType<typeof graphQLRemoteitExits>>, 'ERROR' | typeof UNSUPPORTED>

const online = (machine: Pick<RemoteitMachine, 'state'>) => machine.state === 'active' || machine.state === 'connected'

export const AdminRemoteitProxies: React.FC<{ onProblem: Problem }> = ({ onProblem }) => {
  const { t } = useTranslation()
  const [proxies, setProxies] = useState<Proxies | 'ERROR' | typeof UNSUPPORTED>()
  const [machines, setMachines] = useState<RemoteitMachine[]>([])
  const [told, setTold] = useState<string>()

  const load = useCallback(async () => {
    setProxies(await graphQLRemoteitProxies())
    const all = await graphQLRemoteitMachines()
    setMachines(Array.isArray(all) ? all : [])
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // While a machine drains, read again every half minute, so its open connections and safe to stop move on by themselves.
  useInterval(load, Array.isArray(proxies) && proxies.some(p => p.devices?.some(d => d.state === 'DRAINING')))

  if (proxies === undefined) return <LoadingMessage />
  if (proxies === 'ERROR') return <Unread what="remote.it's proxies" />
  if (!Array.isArray(proxies)) return null // an API without them: the page above says why

  return (
    <>
      {told && (
        <Notice severity="info" fullWidth onClose={() => setTold(undefined)}>
          {told}
        </Notice>
      )}
      {!proxies.length && (
        <List>
          <ListItem>
            <ListItemText secondary="None yet: make one at a location below, then add machines to run it." />
          </ListItem>
        </List>
      )}
      {proxies.map(proxy => (
        <List key={proxy.id} data-remoteit-proxy={proxy.id}>
          <ListSubheader>
            {proxy.name} · {proxy.host} · {proxy.provider || proxy.location}
          </ListSubheader>
          <SelectSetting
            icon="right-to-bracket"
            label="A machine added goes into service"
            value={proxy.activation}
            values={[
              { key: 'auto', name: 'By itself, once its checks pass' },
              { key: 'admin', name: 'When an admin puts it in service' },
            ]}
            onChange={async activation => {
              const refused = refusalOf(await graphQLSetProxyActivation(proxy.id, activation as 'auto' | 'admin'))
              if (refused !== undefined) onProblem(refused || `${proxy.name}'s activation was not changed.`)
              await load()
            }}
          />
          {(proxy.devices ?? []).map(device => (
            <RunListItem
              key={device.id}
              kind="proxy"
              run={device}
              name={proxy.name}
              title={device.host ? `${device.name || device.id} · ${device.host}` : undefined}
              activation={proxy.activation}
              manage
              onChanged={async (runs, machine) => {
                setTold(stillRunsLine(t, machine.name, runs))
                await load()
              }}
            >
              {device.host && <Renumber deviceId={device.id} host={device.host} onDone={load} />}
            </RunListItem>
          ))}
          <AddMachine
            kind="proxy"
            machines={machines.filter(machine => !machine.proxy)}
            onAdd={async (deviceId, number) => {
              const added = await graphQLAddProxyDevice(proxy.id, deviceId, number)
              if ('reason' in added) onProblem(added.reason || 'The machine was not added.')
              await load()
            }}
          />
        </List>
      ))}
      <NewAtLocation kind="proxy" onProblem={onProblem} onMade={load} />
    </>
  )
}

export const AdminRemoteitExits: React.FC<{ onProblem: Problem }> = ({ onProblem }) => {
  const { t } = useTranslation()
  const [exits, setExits] = useState<Exits | 'ERROR' | typeof UNSUPPORTED>()
  const [machines, setMachines] = useState<RemoteitMachine[]>([])
  const [told, setTold] = useState<string>()

  const load = useCallback(async () => {
    setExits(await graphQLRemoteitExits())
    const all = await graphQLRemoteitMachines()
    setMachines(Array.isArray(all) ? all : [])
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (exits === undefined) return <LoadingMessage />
  if (exits === 'ERROR') return <Unread what="remote.it's exits" />
  if (!Array.isArray(exits)) return null

  return (
    <>
      {told && (
        <Notice severity="info" fullWidth onClose={() => setTold(undefined)}>
          {told}
        </Notice>
      )}
      {!exits.length && (
        <List>
          <ListItem>
            <ListItemText secondary="None yet: make one at a location below, then add machines to run it." />
          </ListItem>
        </List>
      )}
      {exits.map(exit => (
        <List key={exit.id} data-remoteit-exit={exit.id}>
          <ListSubheader>
            {exit.name} · {exit.provider || exit.location} · {exit.users ?? 0} user{exit.users === 1 ? '' : 's'}
            {exit.offered ? '' : ' · not offered: no machine takes traffic'}
          </ListSubheader>
          <SelectSetting
            icon="right-to-bracket"
            label="A machine added goes into service"
            value={exit.activation}
            values={[
              { key: 'auto', name: 'By itself, once its checks pass' },
              { key: 'admin', name: 'When an admin puts it in service' },
            ]}
            onChange={async activation => {
              const refused = refusalOf(await graphQLSetExitActivation(exit.id, activation as 'auto' | 'admin'))
              if (refused !== undefined) onProblem(refused || `${exit.name}'s activation was not changed.`)
              await load()
            }}
          />
          {(exit.devices ?? []).map(device => (
            <RunListItem
              key={device.id}
              kind="exit"
              run={device}
              name={exit.name}
              activation={exit.activation}
              manage
              onChanged={async (runs, machine) => {
                setTold(stillRunsLine(t, machine.name, runs))
                await load()
              }}
            />
          ))}
          <AddMachine
            kind="exit"
            lan={exit.lan}
            machines={machines.filter(machine => !machine.exit)}
            onAdd={async deviceId => {
              const added = await graphQLAddExitDevice(exit.id, deviceId)
              if ('reason' in added) onProblem(added.reason || 'The machine was not added.')
              await load()
            }}
          />
        </List>
      ))}
      <NewAtLocation kind="exit" onProblem={onProblem} onMade={load} />
    </>
  )
}

export const AdminRemoteitMachines: React.FC<{ onProblem: Problem }> = ({ onProblem }) => {
  const { t } = useTranslation()
  const [machines, setMachines] = useState<RemoteitMachine[] | 'ERROR' | typeof UNSUPPORTED>()
  const [told, setTold] = useState<string>()

  const load = useCallback(async () => setMachines(await graphQLRemoteitMachines()), [])

  useEffect(() => {
    load()
  }, [load])

  useInterval(
    load,
    Array.isArray(machines) && machines.some(m => m.proxy?.state === 'DRAINING' || m.exit?.state === 'DRAINING')
  )

  if (machines === undefined) return <LoadingMessage />
  if (machines === 'ERROR') return <Unread what="the machines" />
  if (!Array.isArray(machines)) return null

  return (
    <>
      {told && (
        <Notice severity="info" fullWidth onClose={() => setTold(undefined)}>
          {told}
        </Notice>
      )}
      <List>
        <ListSubheader>Machines</ListSubheader>
        {!machines.length && (
          <ListItem>
            <ListItemText secondary="None yet: install a machine with the registration code below." />
          </ListItem>
        )}
        {machines.map(machine => (
          <Machine
            key={machine.id}
            machine={machine}
            onProblem={onProblem}
            onChanged={async runs => {
              if (runs) setTold(stillRunsLine(t, machine.name || machine.id, runs))
              await load()
            }}
          />
        ))}
      </List>
      <RegistrationCode onProblem={onProblem} />
    </>
  )
}

// One machine: whether it is online, whose account it is in, everything it runs with its state in each, and the
// actions on all of it at once.
const Machine: React.FC<{ machine: RemoteitMachine; onProblem: Problem; onChanged: (runs?: DeviceRuns) => void }> = ({
  machine,
  onProblem,
  onChanged,
}) => {
  const { t } = useTranslation()
  const [busy, setBusy] = useState(false)
  const runs = [
    machine.proxy && `proxy ${machine.proxy.proxy?.name ?? ''}: ${runStateLabel(t, machine.proxy).toLowerCase()}`,
    machine.exit && `exit ${machine.exit.exit?.name ?? ''}: ${runStateLabel(t, machine.exit).toLowerCase()}`,
  ].filter(Boolean)

  const adopt = async () => {
    setBusy(true)
    const refused = refusalOf(await graphQLAdoptRemoteitProxy(machine.id))
    if (refused !== undefined) onProblem(refused || `${machine.name ?? machine.id} was not moved to remote.it.`)
    setBusy(false)
    onChanged()
  }

  return (
    <ListItem data-machine={machine.id} alignItems="flex-start">
      <ListItemIcon>
        <Icon name="server" size="md" color={online(machine) ? 'primary' : 'grayDark'} />
      </ListItemIcon>
      <ListItemText
        primary={
          <>
            {machine.name ?? 'no such device'}
            {machine.proxy?.host ? ` · ${machine.proxy.host}` : ''} · {online(machine) ? 'online' : 'offline'}
            {!online(machine) && machine.lastReported && (
              <>
                {' '}
                since <Timestamp date={new Date(machine.lastReported)} />
              </>
            )}
          </>
        }
        secondaryTypographyProps={{ component: 'div' }}
        secondary={
          <>
            <Typography component="div" variant="caption">
              {machine.id} · {runs.length ? `runs ${runs.join('; ')}` : 'runs nothing yet: add it on the Proxies or Exits tab'}
            </Typography>
            {!machine.system && (
              <Typography component="div" variant="caption" color="warning.main">
                In {machine.owner ?? 'another'} account: move it, and its shares end and its owner no longer sees it.
                <Box marginTop={0.5}>
                  <Button size="small" variant="contained" disabled={busy} onClick={adopt}>
                    Move to remote.it
                  </Button>
                </Box>
              </Typography>
            )}
            {(machine.proxy || machine.exit) && (
              <RunActions
                device={{ id: machine.id, name: machine.name || machine.id }}
                scope="device"
                disabled={busy}
                onDone={onChanged}
              />
            )}
          </>
        }
      />
    </ListItem>
  )
}

// The number in one of remote.it's devices' own name, e<number>-r3.
export const numberOf = (host: string) => Number(/^e(\d+)-r3\./.exec(host)?.[1]) || undefined

/* One of remote.it's devices running a proxy given another number, e<number>-r3: said first — its name before and
   after (URLs under the old one stop reaching it), its certificate kept under the new name or still to come, and
   whether the new name has an address for its proxy's record —, then done. */
const Renumber: React.FC<{ deviceId: string; host: string; onDone: () => void }> = ({ deviceId, host, onDone }) => {
  const [number, setNumber] = useState('')
  const [said, setSaid] = useState<Renumbered | { reason: string }>()
  const [busy, setBusy] = useState(false)
  const valid = /^[1-9][0-9]{0,3}$/.test(number) && Number(number) !== numberOf(host)

  const ask = async () => {
    setBusy(true)
    setSaid(await graphQLRenumberProxyDevice(deviceId, Number(number), false))
    setBusy(false)
  }

  const apply = async () => {
    setBusy(true)
    const done = await graphQLRenumberProxyDevice(deviceId, Number(number), true)
    setBusy(false)
    if ('reason' in done) return setSaid({ reason: done.reason || 'It was not renumbered: try again.' })
    setSaid(undefined)
    setNumber('')
    onDone()
  }

  const preview = said && !('reason' in said) ? said : undefined
  return (
    <Box display="flex" gap={1} alignItems="center" marginTop={0.5} data-renumber={deviceId}>
      <TextField
        size="small"
        label="New number"
        placeholder={String((numberOf(host) ?? 0) + 1)}
        value={number}
        sx={{ width: 120 }}
        onChange={event => setNumber(event.target.value.trim())}
      />
      <Button size="small" variant="outlined" disabled={busy || !valid} onClick={ask}>
        Renumber
      </Button>
      <Confirm
        open={!!said}
        title={preview ? `Rename ${preview.from} to ${preview.to}?` : 'Renumber'}
        action="Renumber"
        color="error"
        disabled={busy || !preview}
        onConfirm={apply}
        onDeny={() => setSaid(undefined)}
      >
        {said && 'reason' in said ? (
          <Notice severity="error" fullWidth>
            {said.reason || 'What it would do could not be said: try again.'}
          </Notice>
        ) : (
          preview && (
            <Typography variant="body2" component="div" data-renumber-says>
              <p>URLs under {preview.from} stop reaching it.</p>
              <p>
                {preview.certificate === 'moved'
                  ? `Its certificate is kept under ${preview.to}, still serving its proxy's names, and one naming ${preview.to} is issued within a day.`
                  : `It holds no certificate yet: one naming ${preview.to} is issued within a day.`}
              </p>
              <p>
                {preview.record === null
                  ? "This stage does not manage the proxies' DNS."
                  : preview.record
                  ? `${preview.to} has an address: it stays in its proxy's record.`
                  : `${preview.to} has no address yet: it is left out of its proxy's record until it has one.`}
              </p>
            </Typography>
          )
        )}
      </Confirm>
    </Box>
  )
}

// Machines to add to a proxy or an exit: those running none of its kind. One of remote.it's proxies' machines takes
// e<number>-r3 as its own name — the next free one, or the number given. An exit whose users reach its devices' local
// networks — never remote.it's — opens each machine's added: said before, as wherever a device is added to an exit.
const AddMachine: React.FC<{
  kind: 'proxy' | 'exit'
  lan?: boolean
  machines: RemoteitMachine[]
  onAdd: (deviceId: string, number?: number) => Promise<void>
}> = ({ kind, lan, machines, onAdd }) => {
  const { t } = useTranslation()
  const [chosen, setChosen] = useState('')
  const [number, setNumber] = useState('')
  const [busy, setBusy] = useState(false)
  if (!machines.length) return null
  const numberValid = !number || /^[1-9][0-9]{0,3}$/.test(number)
  const picked = machines.find(each => each.id === chosen)
  return (
    <ListItem>
      <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
        <TextField
          select
          size="small"
          label="Add a machine"
          value={chosen}
          sx={{ minWidth: 220 }}
          onChange={event => setChosen(String(event.target.value))}
        >
          {machines.map(machine => (
            <MenuItem key={machine.id} value={machine.id}>
              {machine.name ?? machine.id} · {online(machine) ? 'online' : 'offline'}
            </MenuItem>
          ))}
        </TextField>
        {kind === 'proxy' && (
          <TextField
            size="small"
            label="e<number>-r3"
            placeholder="next free"
            value={number}
            error={!numberValid}
            sx={{ width: 130 }}
            onChange={event => setNumber(event.target.value.trim())}
          />
        )}
        <Button
          size="small"
          variant="contained"
          disabled={busy || !chosen || !numberValid}
          onClick={async () => {
            setBusy(true)
            await onAdd(chosen, number ? Number(number) : undefined)
            setChosen('')
            setNumber('')
            setBusy(false)
          }}
        >
          Add
        </Button>
        {kind === 'exit' && lan && (
          <Typography variant="caption" color="warning.main" width="100%" data-lan-warning>
            {lanAddWarning(t, picked ? [picked.name ?? picked.id] : [])}
          </Typography>
        )}
      </Box>
    </ListItem>
  )
}

// A new proxy or exit of remote.it's at a location: our code (three letters after the metro's airport and a digit),
// its coordinates, and who and where, for people. Named the code and the next free letter; machines are added after.
const NewAtLocation: React.FC<{ kind: 'proxy' | 'exit'; onProblem: Problem; onMade: () => void }> = ({
  kind,
  onProblem,
  onMade,
}) => {
  const [location, setLocation] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [provider, setProvider] = useState('')
  const [busy, setBusy] = useState(false)
  const at: Location = {
    location: location.trim(),
    latitude: Number(latitude),
    longitude: Number(longitude),
    provider: provider.trim() || undefined,
  }
  const valid =
    /^[a-z]{3}[0-9]$/.test(at.location) &&
    latitude.trim() !== '' &&
    longitude.trim() !== '' &&
    Math.abs(at.latitude) <= 90 &&
    Math.abs(at.longitude) <= 180

  const make = async () => {
    setBusy(true)
    const refused = refusalOf(await graphQLCreateRemoteit(kind, at))
    setBusy(false)
    if (refused !== undefined) return onProblem(refused || `The ${kind} was not made.`)
    setLocation('')
    setLatitude('')
    setLongitude('')
    setProvider('')
    onMade()
  }

  return (
    <List>
      <ListSubheader>New {kind} at a location</ListSubheader>
      <Gutters>
        <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
          <TextField
            size="small"
            label="Location"
            placeholder="pdx1"
            value={location}
            sx={{ width: 110 }}
            onChange={event => setLocation(event.target.value.toLowerCase())}
          />
          <TextField size="small" label="Latitude" value={latitude} sx={{ width: 120 }} onChange={e => setLatitude(e.target.value)} />
          <TextField
            size="small"
            label="Longitude"
            value={longitude}
            sx={{ width: 120 }}
            onChange={event => setLongitude(event.target.value)}
          />
          <TextField
            size="small"
            label="Provider"
            placeholder="AWS us-west-2 (Boardman)"
            value={provider}
            onChange={event => setProvider(event.target.value)}
          />
          <Button size="small" variant="contained" disabled={busy || !valid} onClick={make}>
            Make the {kind}
          </Button>
        </Box>
        <Typography variant="caption" color="textSecondary" component="p" marginTop={1}>
          Named its location and the next free letter (pdx1a, pdx1b…); then add machines to run it.
        </Typography>
      </Gutters>
    </List>
  )
}

// The registration code, shown only when asked: it puts a machine in remote.it's account.
const RegistrationCode: React.FC<{ onProblem: Problem }> = ({ onProblem }) => {
  const [code, setCode] = useState<string>()
  const [asking, setAsking] = useState(false)

  const show = async () => {
    setAsking(true)
    const result = await graphQLRemoteitProxyCode()
    if (result === 'ERROR') onProblem('Could not get the registration code.')
    else setCode(result)
    setAsking(false)
  }

  return (
    <List>
      <ListSubheader>Add a machine</ListSubheader>
      <Gutters>
        {code ? (
          <CopyCodeBlock value={code} label="Registration code" />
        ) : (
          <Button size="small" variant="contained" disabled={asking} onClick={show}>
            Show the registration code
          </Button>
        )}
        <Typography variant="caption" color="textSecondary" component="p" marginTop={1}>
          Install the device package with this code: the machine registers into remote.it's account, not yours, and
          appears above, running nothing until it is added to a proxy or an exit. Keep it secret: anyone with it can add
          a device to remote.it's account.
        </Typography>
      </Gutters>
    </List>
  )
}

// A list that could not be read: said, not shown as none.
const Unread: React.FC<{ what: string }> = ({ what }) => (
  <Notice severity="error" fullWidth>
    Could not read {what}.
  </Notice>
)

// Read again every half minute while asked: a drain's open connections and safe to stop move on by themselves.
function useInterval(run: () => void, on: boolean) {
  useEffect(() => {
    if (!on) return
    const timer = setInterval(run, 30_000)
    return () => clearInterval(timer)
  }, [on, run])
}
