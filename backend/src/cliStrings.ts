import environment from './environment'
import user from './User'

export default {
  signIn() {
    return `-j signin --user ${user.username} --authhash ${user.authHash}`
  },

  signOut() {
    return `-j signout --authhash ${user.authHash}`
  },

  status() {
    return `-j status --authhash ${user.authHash}`
  },

  setup(device: ITargetDevice) {
    return `-j --manufacture-id ${environment.appCode} setup --name "${device.name}" --authhash ${user.authHash}`
  },

  add(t: ITarget) {
    return `-j --manufacture-id ${environment.appCode} add --enable ${!t.disabled} --name "${t.name}" --port ${
      t.port
    } --type ${t.type} --hostname ${t.hostname || '127.0.0.1'} --authhash ${user.authHash}`
  },

  setDevice(d: ITargetDevice) {
    return `-j --manufacture-id ${environment.appCode} modify --id ${d.uid} --enable ${!d.disabled} --name "${
      d.name
    }" --authhash ${user.authHash}`
  },

  setTarget(t: ITarget) {
    return `-j --manufacture-id ${environment.appCode} modify --id ${t.uid} --enable ${!t.disabled} --name "${
      t.name
    }" --port ${t.port} --type ${t.type} --hostname ${t.hostname} --authhash ${user.authHash}`
  },

  unregister() {
    return `-j unregister --yes --authhash ${user.authHash}`
  },

  remove(t: ITarget) {
    return `-j remove --id ${t.uid} --authhash ${user.authHash}`
  },

  connect(c: IConnection) {
    return `-j connection add --id ${c.id} --connect true --name "${c.name}" --port ${c.port} --hostname ${
      c.host
    } --restrict ${
      c.restriction
    } --retry ${!!c.autoStart} --failover ${!!c.failover} --p2p ${!c.proxyOnly} --servicetype ${c.typeID} --authhash ${
      user.authHash
    } --manufacture-id ${environment.appCode}`
  },

  disconnect(c: IConnection) {
    return `-j connection remove --id ${c.id} --authhash ${user.authHash}`
  },

  setConnect(c: IConnection) {
    return `-j connection modify --id ${c.id} --name "${c.name}" --port ${c.port} --hostname ${c.host} --restrict ${
      c.restriction
    } --retry ${!!c.autoStart} --failover ${!!c.failover} --p2p ${!c.proxyOnly} --enable ${!!c.active} --servicetype ${
      c.typeID
    } --authhash ${user.authHash} --manufacture-id ${environment.appCode}`
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

  uninstall() {
    return `-j uninstall --yes`
  },

  scan(ipMask?: string) {
    return ipMask ? `-j scan -m ${ipMask}` : '-j scan'
  },

  version() {
    return 'version'
  },
}
