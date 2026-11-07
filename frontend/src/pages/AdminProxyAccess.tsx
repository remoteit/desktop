import React, { useEffect, useState } from 'react'
import { List, ListSubheader } from '@mui/material'
import { graphQLRemoteitMachines, RemoteitMachine } from '../services/graphQLRemoteit'
import { ProxyAccessList } from '../components/ProxyAccessList'
import { SelectSetting } from '../components/SelectSetting'

/* Who used remote.it's proxies (graphql adminProxyAccess): every visitor connection, failures and refusals with their
   reasons, the address whole — one machine's, or all of them. Admins only; this page's own words English only, as the
   rest of /admin. */
export const AdminProxyAccess: React.FC = () => {
  const [machines, setMachines] = useState<RemoteitMachine[]>([])
  const [proxyId, setProxyId] = useState('')

  useEffect(() => {
    graphQLRemoteitMachines().then(list => {
      if (Array.isArray(list)) setMachines(list.filter(machine => machine.proxy))
    })
  }, [])

  return (
    <List>
      <ListSubheader>remote.it's proxies: recent access</ListSubheader>
      <SelectSetting
        icon="server"
        label="Machine"
        value={proxyId}
        values={[
          { key: '', name: 'All of them' },
          ...machines.map(m => ({
            key: m.id,
            name: `${m.proxy?.host || m.proxy?.proxy?.name || m.id} (${m.name ?? m.id})`,
          })),
        ]}
        onChange={setProxyId}
      />
      <ProxyAccessList scope={{ admin: true, proxyId: proxyId || undefined }} showEndpoint showProxy={!proxyId} />
    </List>
  )
}
