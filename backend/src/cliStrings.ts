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

  defaults() {
    const useCert = !!preferences.get().useCertificate
    return `-j connection defaults --enableCertificate ${useCert} --enableOneHTTPSListener false --enableOneHTTPListener false --authhash ${user.authHash}`
  },

  status() {
    return `-j status --connections --authhash ${user.authHash}`
  },

  agentStatus() {
    return `-j agent status --authhash ${user.authHash}`
  },

  register(code: string) {
    return `-j --manufacture-id ${environment.appCode} register --registrationCode "${code}" --authhash ${user.authHash}`
  },

  unregister() {
    return `-j unregister --yes --authhash ${user.authHash}`
  },

  restore(deviceId: string) {
    return `-j restore --id ${deviceId}`
  },

  connect(c: IConnection) {
    return `-j connection add \
      --id ${c.id} \
      --name "${c.name}" \
      ${c.port ? `--port ${c.port}` : ''} \
      --ip ${c.ip} \
      --timeout ${c.timeout} \
      --restrict ${c.restriction} \
      --failover ${!!c.failover} \
      --p2p ${!c.proxyOnly} \
      --servicetype ${c.typeID} \
      ${c.targetHost ? `--targetHostname ${c.targetHost}` : ''} \
      --enableCertificate ${!!preferences.get().useCertificate} \
      --log ${!!c.log} \
      --logfolder "${environment.connectionLogPath}" \
      --manufacture-id ${environment.appCode} \
      --authhash ${user.authHash}`
  },

  stop(c: IConnection) {
    return `-j connection disconnect --id ${c.id} --authhash ${user.authHash}`
  },

  remove(c: IConnection) {
    return `-j connection remove --id ${c.id} --authhash ${user.authHash}`
  },

  setConnect(c: IConnection) {
    return `-j connection modify \
    --id ${c.id} \
    --name "${c.name}" \
    --port ${c.port} \
    --ip ${c.ip} \
    --timeout ${c.timeout} \
    --restrict ${c.restriction} \
    --failover ${!!c.failover} \
    --p2p ${!c.proxyOnly} \
    --enable ${!!c.enabled} \
    --servicetype ${c.typeID} \
    ${c.targetHost ? `--targetHostname ${c.targetHost}` : ''} \
    --enableCertificate ${!!preferences.get().useCertificate} \
    --log ${!!c.log} \
    --logfolder "${environment.connectionLogPath}" \
    --manufacture-id ${environment.appCode} \
    --authhash ${user.authHash}`
  },

  serviceInstall() {
    return '-j agent install'
  },

  serviceUninstall() {
    return `-j agent uninstall`
  },

  serviceRestart() {
    return `-j agent restart`
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
