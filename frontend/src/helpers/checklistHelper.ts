const notP2P = (connection: IConnection) =>
  !((connection.connected || connection.connecting || connection.disconnecting) && connection.isP2P)

const notP2PDisconnected = (connection: IConnection) =>
  !connection.isP2P || !connection.checkpoint?.targetServiceReachable

const notProxy = (connection: IConnection) =>
  !((connection.connected || connection.connecting || connection.disconnecting) && !connection.isP2P)

export const checklist: ILookup<{
  title: string
  hide?: (connection: IConnection) => boolean
}> = {
  // on demand setup
  canBindToPortLocally: {
    title: 'Bound to local port',
  },
  hostnameCanFetch: {
    title: 'Hostname fetched',
  },
  hostnameCanResolve: {
    title: 'Hostname resolved',
  },
  // peer to peer only with connect request
  connectdCanPortBind: {
    title: 'Agent bound to local port',
    hide: notP2P,
  },
  connectdCanStart: {
    title: 'Agent can start',
    hide: notP2P,
  },
  connectdCanConnectToChatServers: {
    title: 'Agent connected to Cloud',
    hide: notP2P,
  },
  connectdCanAuth: {
    title: 'Agent authenticated',
    hide: notP2P,
  },
  connectdTunnelCreated: {
    title: 'Peer to peer tunnel created',
    hide: notP2P,
  },
  targetServiceReachable: {
    title: 'Target service is reachable',
    hide: notP2PDisconnected,
  },
  // proxy only
  proxyCanCreate: {
    title: 'Proxy connection established',
    hide: notProxy,
  },
}
