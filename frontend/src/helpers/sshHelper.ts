import type { DeviceApp } from '../services/graphQLDeviceApps'

/* Plain ssh to a remote.it name: a machine signed in on its remote.it device app gets a certificate for its own ssh
   (connectd remoteit-device ssh-config), which an app that signs people in by certificate takes — so its command works
   there as it is. */

/** An app whose service opens as a terminal (pages/TerminalPage) with the person's own account and a certificate: its
 *  service is ssh and it declares person-certificates (presence-contract docs/self-contained-apps.md, "Capabilities,
 *  as the platform keeps them"). graphql's sshAccount, sshCertificate and sshHostKey answer for its service. */
export const opensTerminal = (app?: Pick<DeviceApp, 'protocol' | 'capabilities'>) =>
  app?.protocol === 'ssh' && !!app.capabilities?.includes('person-certificates')

/** The plain ssh command for a name and port: the port named only when it is not 22. */
export const sshCommand = (name: string, port?: number) =>
  port && port !== 22 ? `ssh -p ${port} ${name}` : `ssh ${name}`
