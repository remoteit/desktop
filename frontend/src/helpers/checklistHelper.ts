const notP2P = connection =>
  !((connection.connected || connection.connecting || connection.disconnecting) && connection.isP2P)

const notProxy = connection =>
  !((connection.connected || connection.connecting || connection.disconnecting) && !connection.isP2P)

const notConnected = connection =>
  !(connection.connected || connection.connecting || connection.disconnecting) &&
  connection.checkpoint.targetServiceReachable

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
  // proxy only
  proxyCanCreate: {
    title: 'Proxy connection established',
    hide: notProxy,
  },
  // any cli connection
  targetServiceReachable: {
    title: 'Target service is reachable',
    hide: notConnected,
  },
}
