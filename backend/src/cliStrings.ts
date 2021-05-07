import environment from './environment'
import preferences from './preferences'
import user from './User'

export default {
  signIn() {
    return `-j signin --user ${user.username} --authhash ${user.authHash}`
  },

  signOut() {
    return `-j signout --authhash ${user.authHash}`
  },

  status() {
    return `-jj status -e --authhash ${user.authHash}`
  },

  agentStatus() {
    return `-j agent status --authhash ${user.authHash}`
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

  restore(deviceId: string) {
    return `-j restore --id ${deviceId}`
  },

  remove(t: ITarget) {
    return `-j remove --id ${t.uid} --authhash ${user.authHash}`
  },

  connect(c: IConnection) {
    return certify(`-j connection add \
      --id ${c.id} \
      --port ${c.port} \
      --hostname ${c.host} \
      --timeout ${c.timeout} \
      --restrict ${c.restriction} \
      --failover ${!!c.failover} \
      --p2p ${!c.proxyOnly} \
      --servicetype ${c.typeID} \
      --authhash ${user.authHash} \
      --log ${!!c.log} \
      --logfolder "${environment.connectionLogPath}" \
      --manufacture-id ${environment.appCode}`)
  },

  disconnect(c: IConnection) {
    return `-j connection remove --id ${c.id} --authhash ${user.authHash}`
  },

  setConnect(c: IConnection) {
    return certify(`-j connection modify \
      --id ${c.id} \
      --name "${c.name}" \
      --port ${c.port} \
      --hostname ${c.host} \
      --timeout ${c.timeout} \
      --restrict ${c.restriction} \
      --failover ${!!c.failover} \
      --p2p ${!c.proxyOnly} \
      --enable ${!!c.enabled} \
      --servicetype ${c.typeID} \
      --authhash ${user.authHash} \
      --manufacture-id ${environment.appCode}`)
  },

  serviceInstall() {
    return '-j agent install'
  },

  serviceUninstall() {
    return `-j agent uninstall`
  },

  serviceStop() {
    return '-j agent stop'
  },

  toolsInstall() {
    return '-j tools install --update'
  },

  toolsUninstall() {
    return '-j tools uninstall --yes'
  },

  reset() {
    return `-j reset --yes`
  },

  uninstall() {
    return `-j uninstall --yes`
  },

  scan(ipMask?: string) {
    return ipMask ? `-j scan -m ${ipMask}` : '-j scan'
  },

  version() {
    return '-j version'
  },
}

function certify(command: string) {
  const { useCertificate } = preferences.get()

  const certCommand = ` \
    --enableReverseHTTPSProxy \
    --reverseHTTPSProxyDomain "${environment.certificateDomain}" \
    --reverseHTTPSProxyCert "${environment.certificatePath}" \
    --reverseHTTPSProxyKey "${environment.certificateKeyPath}"`

  return useCertificate ? command + certCommand : command
  //--domain ${domain} \
  //--targetHostname ${c.targetHost} \
  //--enableHTTP ${ /* if http(s) or lan shared */} \
  //--cert "${environment.certificatePath}/${domain}.cert" \
  //--Key "${environment.certificatePath}/${domain}.key"`
}
