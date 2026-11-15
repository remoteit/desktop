/* TEMPORARY — the console only, until it declares what it does. Deleted by the removal step (presence-contract
   docs/self-contained-apps.md, "Order", step 4: "Remove the special cases"), with its two calls.

   The portal draws every app from what the API says of it: Open terminal, the person's own account and the host key
   checked for an app whose service is ssh (protocol) and that declares person-certificates; its service found by
   DeviceApp.serviceId, or — disabled, with no service named — by its app host (helpers/appsHelper appHost). The console
   declares these in its next release (step 3), and the migration re-makes its services on its app host
   (remoteit-app-remoteit-console). Until then graphql says nothing of them for it, so that it is drawn as it was:

     untilConsoleDeclares  the console's row with no capabilities is taken as declaring what it does today: ssh,
                           people's accounts and certificates, AI commands
     untilConsoleMigrates  a service at the console's host (remoteit-console) is taken as at its app host

   Nothing else in the portal names the console. */

const CONSOLE = 'remoteit.console'
const CONSOLE_HOST = 'remoteit-console'
const CONSOLE_APP_HOST = 'remoteit-app-remoteit-console'
const CONSOLE_DECLARES = ['person-accounts', 'person-certificates', 'ssh-exec']

export function untilConsoleDeclares<T extends { id: string; protocol: string | null; capabilities: string[] }>(
  app: T
): T {
  if (app.id !== CONSOLE || app.capabilities.length) return app
  return { ...app, protocol: app.protocol ?? 'ssh', capabilities: CONSOLE_DECLARES }
}

export const untilConsoleMigrates = (host: string): string => (host === CONSOLE_HOST ? CONSOLE_APP_HOST : host)
