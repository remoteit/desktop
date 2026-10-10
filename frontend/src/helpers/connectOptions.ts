import { isConsoleService } from './sshHelper'

/* Every way to connect to a service, side by side on its page — for now, until one way is chosen for each (Evan,
   2026-10-09). Only a service with a name in device subnets has more than the proxy: the names are behind the
   device-sessions gate (hooks/useSubnetReach).

   - proxy: today's connection (ComboButton).
   - subnet: the name, when an agent on this machine reaches it (components/LocalSubnetConnect).
   - browser: a web service in its own tab through this browser's client (services/browserGateway). On a machine
     whose agent reaches the name, the agent answers it first, so the tab would be the subnet's: said, not offered.
   - browserSSH: an SSH service's terminal in this app, its session through this browser's client (pages/TerminalPage)
     — the client is reached past an agent here, so it is offered either way.
   - terminal: an SSH service's command for a terminal here: by its name when this machine reaches it — the command
     the device app's ssh certificates match — else by the proxy's host and port, once connected. */

export type ConnectKind = 'web' | 'ssh' | 'console' | 'other'

export type ConnectOption =
  | { id: 'proxy' }
  | { id: 'subnet' }
  | { id: 'browser'; unavailable?: 'agent' | 'type' }
  | { id: 'browserSSH' }
  | { id: 'terminal'; via: 'subnet' | 'proxy' }

export const connectKind = (service: Pick<IService, 'typeID' | 'host'> | undefined, web: boolean): ConnectKind =>
  isConsoleService(service) ? 'console' : service?.typeID === 28 ? 'ssh' : web ? 'web' : 'other'

export function connectOptions(kind: ConnectKind, named: boolean, local: boolean): ConnectOption[] {
  if (!named) return [{ id: 'proxy' }]
  if (kind === 'ssh' || kind === 'console')
    return [{ id: 'proxy' }, { id: 'browserSSH' }, { id: 'terminal', via: local ? 'subnet' : 'proxy' }]
  return [
    { id: 'proxy' },
    ...(local ? [{ id: 'subnet' } as const] : []),
    kind === 'web'
      ? local
        ? { id: 'browser', unavailable: 'agent' }
        : { id: 'browser' }
      : { id: 'browser', unavailable: 'type' },
  ]
}
