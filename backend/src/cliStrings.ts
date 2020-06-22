import environment from './environment'
import user from './User'

export default {
  signIn() {
    return `-j signin --user ${user.username} --authhash ${user.authHash}`
  },

  signOut() {
    return `-j signout --authhash ${user.authHash}`
  },

  setup(device: ITargetDevice) {
    return `-j --manufacture-id ${environment.appCode} setup --name "${device.name}" --authhash ${user.authHash}`
  },

  add(t: ITarget) {
    return `-j --manufacture-id ${environment.appCode} add --name "${t.name}" --port ${t.port} --type ${
      t.type
    } --hostname ${t.hostname || '127.0.0.1'} --authhash ${user.authHash}`
  },

  unregister() {
    return `-j unregister --yes --authhash ${user.authHash}`
  },

  remove(t: ITarget) {
    return `remove --id ${t.uid} --authhash ${user.authHash}`
  },

  teardown() {
    return `-j teardown --yes`
  },

  connect(c: IConnection) {
    return `-j connection add --id ${c.id} --name "${c.name}" --port ${c.port} --hostname ${c.host} --restrict ${c.restriction} --retry ${c.autoStart} --failover ${c.failover} --authhash ${user.authHash} --manufacture-id ${environment.appCode}`
  },

  disconnect(c: IConnection) {
    return `-j connection remove --id ${c.id} --authhash ${user.authHash}`
  },

  setConnect(c: IConnection) {
    return `-j connection modify --id ${c.id} --name "${c.name}" --port ${c.port} --hostname ${c.host} --restrict ${c.restriction} --retry ${c.autoStart} --failover ${c.failover} --enable ${c.active} --authhash ${user.authHash} --manufacture-id ${environment.appCode}`
  },

  serviceInstall() {
    return '-j service install'
  },
  serviceUninstall() {
    return '-j service uninstall'
  },

  toolsInstall() {
    return '-j tools install --update'
  },

  toolsUninstall() {
    return '-j tools uninstall --yes'
  },

  scan(ipMask?: string) {
    return ipMask ? `-j scan -m ${ipMask}` : '-j scan'
  },

  version() {
    return 'version'
  },
}
