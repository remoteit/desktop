/* Plain ssh to a remote.it name: a machine signed in on its remote.it device app gets a certificate for its own ssh
   (connectd remoteit-device ssh-config), which the console takes — so its command works there as it is. */

/** The console's service: SSH, its host the device's console (graphql CONSOLE_HOST). */
export const isConsoleService = (service?: Pick<IService, 'typeID' | 'host'>) =>
  service?.typeID === 28 && service?.host === 'remoteit-console'

/** The plain ssh command for a name and port: the port named only when it is not 22. */
export const sshCommand = (name: string, port?: number) =>
  port && port !== 22 ? `ssh -p ${port} ${name}` : `ssh ${name}`
