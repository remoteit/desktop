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
import { DeviceRuns, RunCheck, graphQLAddExitDevice, graphQLAddProxyDevice } from '../services/graphQLDeviceRuns'
import { graphQLSetExitActivation, graphQLSetExitProduct } from '../services/graphQLExits'
import { graphQLSetProxyActivation, graphQLSetProxyProduct } from '../services/graphQLProxy'
import {
  Location,
  RemoteitMachine,
  graphQLAdoptRemoteitProxy,
  graphQLCreateRemoteit,
  graphQLRemoteitExits,
  graphQLRemoteitMachines,
  graphQLRemoteitProxies,
  graphQLRemoteitProxyProduct,
  RemoteitProxyProduct,
} from '../services/graphQLRemoteit'
import {
  graphQLCreateDeviceProductJoinKey,
  graphQLRevokeDeviceProductJoinKey,
  graphQLSetDeviceProductLifecycle,
} from '../services/graphQLDeviceProducts'
import { lanAddWarning, runStateLabel, stillRunsLine } from '../helpers/runsHelper'
import { Confirm } from '../components/Confirm'
import { RunListItem } from '../components/RunListItem'
import { RunActions } from '../components/RunActions'
import { SelectSetting } from '../components/SelectSetting'
import { LoadingMessage } from '../components/LoadingMessage'
import { ProductJoinKeys } from '../components/ProductJoinKeys'
import { ProductLifecycleSetting } from '../components/ProductLifecycle'
import { Timestamp } from '../components/Timestamp'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Icon } from '../components/Icon'

/* remote.it's proxies and exits, for its admins (graphql-api docs/PROXY-GROUPS.md §13): two kinds at a location each —
   the pdx1a proxy and the pdx1a exit — run by the same machines, remote.it's devices, each shown by its device name
   (§11 wave 2: no e<n>-r3 name of its own). A tab each: the proxies, the exits, and the machines. A proxy's or an exit's
   page lists the machines running it, each with its state there and its actions in it alone (saying first what each
   does), adds a machine to it, sets its activation and the products whose new devices join it, and makes a new one at
   a location. The machines' page shows everything each runs, with the actions on all of it at once — each saying first
   what it does to each proxy and exit — so taking a machine down never surprises; a machine still in someone's account
   is moved to remote.it; and remote.it's proxy product, which a new machine registers with, has its join keys and
   lifecycle there. English only, as the rest of /admin. */

type Problem = (problem: string) => void
type Proxies = Exclude<Awaited<ReturnType<typeof graphQLRemoteitProxies>>, 'ERROR' | typeof UNSUPPORTED>
type Exits = Exclude<Awaited<ReturnType<typeof graphQLRemoteitExits>>, 'ERROR' | typeof UNSUPPORTED>

const online = (machine: Pick<RemoteitMachine, 'state'>) => machine.state === 'active' || machine.state === 'connected'

export const AdminRemoteitProxies: React.FC<{ onProblem: Problem }> = ({ onProblem }) => {
  const { t } = useTranslation()
  const [proxies, setProxies] = useState<Proxies | 'ERROR' | typeof UNSUPPORTED>()
  const [machines, setMachines] = useState<RemoteitMachine[]>([])
  const [told, setTold] = useState<string>()
  const offered = useOfferedProducts()

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
          <RunProducts
            kind="proxy"
            name={proxy.name}
            products={proxy.products ?? []}
            offered={offered}
            onChange={async (productId, joined) => {
              const refused = refusalOf(await graphQLSetProxyProduct(proxy.id, productId, joined))
              if (refused !== undefined) onProblem(refused || `${proxy.name}'s products were not changed.`)
              await load()
            }}
          />
          {(proxy.devices ?? []).map(device => (
            <RunListItem
              key={device.id}
              kind="proxy"
              run={device}
              name={proxy.name}
              activation={proxy.activation}
              manage
              onChanged={async (runs, machine) => {
                setTold(stillRunsLine(t, machine.name, runs))
                await load()
              }}
            >
              <Checks checks={device.checks} />
            </RunListItem>
          ))}
          <AddMachine
            kind="proxy"
            machines={machines.filter(machine => !machine.proxy)}
            onAdd={async deviceId => {
              const added = await graphQLAddProxyDevice(proxy.id, deviceId)
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
  const offered = useOfferedProducts()

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
          <RunProducts
            kind="exit"
            name={exit.name}
            products={exit.products ?? []}
            offered={offered}
            onChange={async (productId, joined) => {
              const refused = refusalOf(await graphQLSetExitProduct(exit.id, productId, joined))
              if (refused !== undefined) onProblem(refused || `${exit.name}'s products were not changed.`)
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
            >
              <Checks checks={device.checks} />
            </RunListItem>
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
            <ListItemText secondary="None yet: a machine registers with a join key of remote.it's proxy product, below." />
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
      <ProxyProduct onProblem={onProblem} />
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
            {machine.name ?? 'no such device'} · {online(machine) ? 'online' : 'offline'}
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

/* A machine's checks in a proxy or an exit, each by name, passed, waiting or failed: the address check (§11 wave 2 —
   whatever answers on 443 at its public address proves it holds its device key, before the address enters the record
   and the proxy's names are signed for it) with the others. Why one is not passed is its state's line (RunListItem).
   Joining, graphql gives every check; serving, those failing now: none, nothing to say. */
const Checks: React.FC<{ checks: RunCheck[] }> = ({ checks }) =>
  checks.length ? (
    <Typography component="div" variant="caption" color="textSecondary" data-checks>
      Checks:{' '}
      {checks
        .map(check => `${check.name} ${check.passed ? 'passed' : check.pending ? 'waiting' : 'failed'}`)
        .join(' · ')}
    </Typography>
  ) : null

type ProductRef = { id: string; name: string }

// The products a proxy or an exit may take new devices from: remote.it's proxy product, which remote.it's machines
// register with — none where this API has none. Read once: it changes only as the product is made.
function useOfferedProducts(): ProductRef[] {
  const [offered, setOffered] = useState<ProductRef[]>([])
  useEffect(() => {
    graphQLRemoteitProxyProduct().then(product => {
      if (product && typeof product === 'object') setOffered([{ id: product.id, name: product.name }])
    })
  }, [])
  return offered
}

/* The products whose new devices join a proxy or an exit of remote.it's (§11 wave 2): a device one of them registers is
   added as a machine added below is — out of service, its proxy setting or exit node turned on — and goes into service
   as the activation says. Removing one is said first: no new device of it joins any more, and none is taken out. */
const RunProducts: React.FC<{
  kind: 'proxy' | 'exit'
  name: string
  products: ProductRef[]
  offered: ProductRef[]
  onChange: (productId: string, joined: boolean) => Promise<void>
}> = ({ kind, name, products, offered, onChange }) => {
  const [chosen, setChosen] = useState('')
  const [removing, setRemoving] = useState<ProductRef>()
  const [busy, setBusy] = useState(false)
  const addable = offered.filter(product => !products.some(each => each.id === product.id))

  const change = async (productId: string, joined: boolean) => {
    setBusy(true)
    await onChange(productId, joined)
    setChosen('')
    setRemoving(undefined)
    setBusy(false)
  }

  return (
    <>
      {products.map(product => (
        <ListItem key={product.id} data-run-product={product.id}>
          <ListItemIcon>
            <Icon name="box" size="md" color="primary" />
          </ListItemIcon>
          <ListItemText
            primary={`Takes new devices from ${product.name}`}
            secondary={`A device it registers joins this ${kind} and goes into service as its activation says.`}
          />
          <Button size="small" disabled={busy} onClick={() => setRemoving(product)}>
            Remove
          </Button>
        </ListItem>
      ))}
      {!products.length && (
        <ListItem data-run-product="">
          <ListItemText secondary={`Takes no product's new devices: a machine runs it once it is added below.`} />
        </ListItem>
      )}
      {!!addable.length && (
        <ListItem>
          <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
            <TextField
              select
              size="small"
              label="Take new devices from"
              value={chosen}
              sx={{ minWidth: 220 }}
              onChange={event => setChosen(String(event.target.value))}
            >
              {addable.map(product => (
                <MenuItem key={product.id} value={product.id}>
                  {product.name}
                </MenuItem>
              ))}
            </TextField>
            <Button size="small" variant="contained" disabled={busy || !chosen} onClick={() => change(chosen, true)}>
              Add product
            </Button>
          </Box>
        </ListItem>
      )}
      <Confirm
        open={!!removing}
        title={`Remove ${removing?.name} from ${name}?`}
        action="Remove"
        disabled={busy}
        onConfirm={() => removing && change(removing.id, false)}
        onDeny={() => setRemoving(undefined)}
      >
        <Typography variant="body2">
          No new device of {removing?.name} joins {name} any more. Its devices running it now keep running it: take them
          out on their own.
        </Typography>
      </Confirm>
    </>
  )
}

// Machines to add to a proxy or an exit: those running none of its kind. An exit whose users reach its devices' local
// networks — never remote.it's — opens each machine's added: said before, as wherever a device is added to an exit.
const AddMachine: React.FC<{
  kind: 'proxy' | 'exit'
  lan?: boolean
  machines: RemoteitMachine[]
  onAdd: (deviceId: string) => Promise<void>
}> = ({ kind, lan, machines, onAdd }) => {
  const { t } = useTranslation()
  const [chosen, setChosen] = useState('')
  const [busy, setBusy] = useState(false)
  if (!machines.length) return null
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
        <Button
          size="small"
          variant="contained"
          disabled={busy || !chosen}
          onClick={async () => {
            setBusy(true)
            await onAdd(chosen)
            setChosen('')
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

/* remote.it's proxy product (§11 wave 2): what a new machine registers with, by one of its join keys — remoteit-proxy's
   bin/place-code puts one in Secrets Manager without showing it, and each machine fetches it at boot —, into remote.it's
   account. Ephemeral, its devices are new at every boot and removed when they deregister or after 10 minutes offline.
   Its join keys, each made here shown once to copy, saying it is not shown again, and revoked here; its lifecycle; the
   proxies and exits that take its devices are on their tabs. Nothing where this API has no such product. */
const ProxyProduct: React.FC<{ onProblem: Problem }> = ({ onProblem }) => {
  const [product, setProduct] = useState<RemoteitProxyProduct | null | 'ERROR' | typeof UNSUPPORTED>()

  useEffect(() => {
    graphQLRemoteitProxyProduct().then(setProduct)
  }, [])

  if (product === undefined) return <LoadingMessage />
  if (product === 'ERROR') return <Unread what="remote.it's proxy product" />
  if (product === UNSUPPORTED) return null

  // Read again after a change. One that fails keeps what is shown — a key on screen stays there — and says so.
  const reload = async () => {
    const read = await graphQLRemoteitProxyProduct()
    if (read === 'ERROR' || read === UNSUPPORTED) onProblem("Could not read remote.it's proxy product again.")
    else setProduct(read)
  }

  return (
    <List data-proxy-product={product?.id ?? ''}>
      <ListSubheader>remote.it's proxy product{product ? `: ${product.name}` : ''}</ListSubheader>
      <Gutters>
        {product ? (
          <>
            <Typography variant="caption" color="textSecondary" component="p" gutterBottom>
              A new machine registers with one of its join keys, into remote.it's account, not yours. It joins the
              proxies and exits that take this product's devices, and goes into service as each one's activation says;
              with none, it appears above, running nothing until it is added to one. Keep its keys secret: anyone with
              one can add a device to remote.it's account.
            </Typography>
            <ProductJoinKeys
              product={product}
              manage
              onCreate={async input => {
                const made = await graphQLCreateDeviceProductJoinKey(input)
                if (made === 'ERROR') return {}
                if ('reason' in made) return { reason: made.reason }
                await reload()
                return { key: made.data?.data?.createDeviceProductJoinKey?.key }
              }}
              onRevoke={async id => {
                await graphQLRevokeDeviceProductJoinKey(product.id, id)
                await reload()
              }}
            />
            <ProductLifecycleSetting
              name={product.name}
              lifecycle={product.lifecycle}
              manage
              onChange={async lifecycle => {
                const refused = refusalOf(await graphQLSetDeviceProductLifecycle(product.id, lifecycle))
                await reload()
                return refused === undefined ? {} : { reason: refused }
              }}
            />
          </>
        ) : (
          <Typography variant="caption" color="textSecondary" component="p">
            remote.it's proxy product is not made yet.
          </Typography>
        )}
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
