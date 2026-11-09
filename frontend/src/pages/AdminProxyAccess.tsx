import React, { useEffect, useState } from 'react'
import { List, ListSubheader } from '@mui/material'
import { graphQLRemoteitMachines, graphQLRemoteitProxies, RemoteitMachine } from '../services/graphQLRemoteit'
import { ProxyAccessList } from '../components/ProxyAccessList'
import { SelectSetting } from '../components/SelectSetting'

/* Who used remote.it's proxies (graphql adminProxyAccess): every visitor connection, failures and refusals with their
   reasons, the address whole — one proxy's, whichever of its machines served it; one machine's; or all of them, each
   saying the machine that served it, by its device name. Admins only; this page's own words English only, as the rest of /admin. */
export const AdminProxyAccess: React.FC = () => {
  const [machines, setMachines] = useState<RemoteitMachine[]>([])
  const [proxies, setProxies] = useState<{ id: string; name: string }[]>([])
  // A proxy's id, or a machine's as device:<id>; none for all of them.
  const [chosen, setChosen] = useState('')

  useEffect(() => {
    graphQLRemoteitMachines().then(list => {
      if (Array.isArray(list)) setMachines(list.filter(machine => machine.proxy))
    })
    graphQLRemoteitProxies().then(list => {
      if (Array.isArray(list)) setProxies(list.map(({ id, name }) => ({ id, name })))
    })
  }, [])

  const device = chosen.startsWith('device:') ? chosen.slice('device:'.length) : undefined
  const names = Object.fromEntries(machines.map(m => [m.id, m.name || m.id]))

  return (
    <List>
      <ListSubheader>remote.it's proxies: recent access</ListSubheader>
      <SelectSetting
        icon="server"
        label="Proxy or machine"
        value={chosen}
        values={[
          { key: '', name: 'All of them' },
          ...proxies.map(p => ({ key: p.id, name: p.name })),
          ...machines.map(m => ({
            key: `device:${m.id}`,
            name: m.proxy?.proxy?.name ? `${m.name ?? m.id} (${m.proxy.proxy.name})` : m.name ?? m.id,
          })),
        ]}
        onChange={setChosen}
      />
      <ProxyAccessList
        scope={{ admin: true, proxy: chosen && !device ? chosen : undefined, deviceId: device }}
        showEndpoint
        devices={device ? undefined : names}
      />
    </List>
  )
}
