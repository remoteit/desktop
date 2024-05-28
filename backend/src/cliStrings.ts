import { IP_PRIVATE } from '@common/constants'
import environment from './environment'
import preferences from './preferences'
import user from './User'

export default {
  signIn() {
    return `-j account signin --user ${user.username} --authhash ${user.authHash}`
  },

  signOut() {
    return `-j --authhash ${user.authHash} account signout`
  },

  status() {
    return `-j --authhash ${user.authHash} status --connections`
  },

  agentStatus() {
    return `-j --authhash ${user.authHash} agent status`
  },

  register(code: string) {
    return `-j --authhash ${user.authHash} --manufacture-id ${environment.appCode} device register --registrationCode "${code}"`
  },

  unregister() {
    return `-j --authhash ${user.authHash} device unregister --yes`
  },

  restore(deviceId: string) {
    return `-j restore --id ${deviceId}`
  },

  connect(c: IConnection) {
    return `-j --authhash ${user.authHash} connection add \
      --id ${c.id} \
      --name "${c.name}" \
      --port ${c.port} \
      --ip ${c.ip} \
      --connectAtStart ${!!c.connectOnReady && c.ip === IP_PRIVATE} \
      --timeout ${c.timeout} \
      --restrict ${c.restriction} \
      --failover ${!!c.failover} \
      --p2p ${!c.proxyOnly} \
      --servicetype ${c.typeID} \
      ${c.disableSecurity ? '--forceHTTP true' : ''} \
      ${c.targetHost ? `--targetHostname ${c.targetHost}` : ''} \
      --enableCertificate ${!!preferences.get().useCertificate && c.ip === IP_PRIVATE} \
      --log ${!!c.log} \
      --logfolder "${environment.connectionLogPath}" \
      --manufacture-id ${environment.appCode}`
  },

  stop(c: IConnection) {
    return `-j --authhash ${user.authHash} connection disconnect --id ${c.id}`
  },

  remove(c: IConnection) {
    return `-j --authhash ${user.authHash} connection remove --id ${c.id}`
  },

  setConnect(c: IConnection) {
    return `-j --authhash ${user.authHash} connection modify \
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
    ${c.disableSecurity ? '--forceHTTP true' : ''} \
    ${c.targetHost ? `--targetHostname ${c.targetHost}` : ''} \
    --enableCertificate ${!!preferences.get().useCertificate && c.ip === IP_PRIVATE} \
    --log ${!!c.log} \
    --logfolder "${environment.connectionLogPath}" \
    --manufacture-id ${environment.appCode}`
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
    return '-j agent tools-install --yes'
  },

  toolsUninstall() {
    return '-j agent tools-uninstall --yes'
  },

  uninstall() {
    return `-j purge --yes --force --keepTools`
  },

  scan(ipMask?: string) {
    return ipMask ? `-j network-scan -m ${ipMask}` : '-j network-scan'
  },

  agentVersion() {
    return '-j agent version'
  },

  version() {
    return '-j version'
  },
}
