import React, { useEffect, useState } from 'react'
import { List, ListSubheader } from '@mui/material'
import { graphQLRemoteitProxyDevices, RemoteitProxyDevice } from '../services/graphQLProxy'
import { ProxyAccessList } from '../components/ProxyAccessList'
import { SelectSetting } from '../components/SelectSetting'

/* Who used remote.it's public proxies (graphql adminProxyAccess): every visitor connection, failures and refusals with
   their reasons, the address whole — one proxy's, or all of them. Admins only; this page's own words English only, as
   the rest of /admin. */
export const AdminProxyAccess: React.FC = () => {
  const [proxies, setProxies] = useState<RemoteitProxyDevice[]>([])
  const [proxyId, setProxyId] = useState('')

  useEffect(() => {
    graphQLRemoteitProxyDevices().then(list => {
      if (Array.isArray(list)) setProxies(list.filter(d => d.proxy))
    })
  }, [])

  return (
    <List>
      <ListSubheader>Public proxies: recent access</ListSubheader>
      <SelectSetting
        icon="server"
        label="Proxy"
        value={proxyId}
        values={[
          { key: '', name: 'All of them' },
          ...proxies.map(p => ({ key: p.id, name: p.proxy ? `${p.proxy.host} (${p.name ?? p.id})` : p.id })),
        ]}
        onChange={setProxyId}
      />
      <ProxyAccessList scope={{ admin: true, proxyId: proxyId || undefined }} showEndpoint showProxy={!proxyId} />
    </List>
  )
}
