export type ConnectRouteKind = 'address' | 'terminal' | 'localPort' | 'public'

export type ConnectSituation = {
  address: boolean // this machine reaches the service by its address (Access on, services/localSubnet)
  terminal: boolean // an ssh service this browser can open as a terminal (helpers/terminalHelper)
  localPort: boolean // a local port is offered on this machine (services/localPorts)
  localPortChosen?: boolean // the person opened or asked for the local port
  publicActive?: boolean // a connection through a public address is on
}

export type ConnectRoutes = { primary: ConnectRouteKind; others: ConnectRouteKind[] }

/** The ways to connect, best first: by address, a terminal, on a local port, then through a public address. A route
 *  the person already turned on leads, so its controls stay in front of them. */
export function chooseRoutes(situation: ConnectSituation): ConnectRoutes {
  const { address, terminal, localPort, localPortChosen, publicActive } = situation
  const order: ConnectRouteKind[] = []
  if (address) order.push('address')
  if (terminal) order.push('terminal')
  if (localPort) order.push('localPort')
  order.push('public')

  const lead: ConnectRouteKind | undefined = publicActive
    ? 'public'
    : localPortChosen && localPort
    ? 'localPort'
    : undefined
  const ordered = lead ? [lead, ...order.filter(kind => kind !== lead)] : order
  return { primary: ordered[0], others: ordered.slice(1) }
}
