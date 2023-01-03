import { getRoute } from './connectionHelper'

export const checklist: ILookup<{
  title: string
  hide?: (connection: IConnection) => boolean
}> = {
  canBindToPortLocally: {
    title: 'Bound to local port',
  },
  hostnameCanFetch: {
    title: 'Hostname fetched',
  },
  hostnameCanResolve: {
    title: 'Hostname resolved',
  },
  connectdCanStart: {
    title: 'Agent can start',
  },
  connectdCanConnectToChatServers: {
    title: 'Agent connected to Cloud',
  },
  connectdCanAuth: {
    title: 'Agent authenticated',
  },
  connectdCanPortBind: {
    title: 'Remote port reachable',
  },
  connectdTunnelCreated: {
    title: 'Peer to peer tunnel created',
    hide: connection => !connection.isP2P,
  },
  proxyCanCreate: {
    title: 'Proxy connection established',
    hide: connection => getRoute(connection) !== 'proxy',
  },
}
