import { graphQLRequestWithReason } from './graphQL'

// Share the same permission check as command-line registration. Phones retain their
// existing client-only setup and user-mode grant for the signed-in person.
export async function createAppRegistration(accountId: string, name: string, platform: number, mobile: boolean) {
  const result = await graphQLRequestWithReason(
    'query AppRegistration($id: String!, $name: String!, $platform: Int, $mobile: Boolean!) {' +
      ' login { account(id: $id) {' +
      ' registrationCode(name: $name, platform: $platform, oneTimeUse: true, unique: true, clientOnly: $mobile, userMode: $mobile)' +
      ' } } }',
    { id: accountId, name, platform, mobile }
  )
  if (result === 'ERROR') throw new Error('Remote.It could not be reached.')
  if ('reason' in result) throw new Error(result.reason)
  const code = result.data?.data?.login?.account?.registrationCode
  if (typeof code !== 'string' || !code) throw new Error('You do not have permission to add devices to this account.')
  return code
}

export const isPhoneInstaller = (platform: string) => platform === 'ios' || platform === 'android'
export const hasDeviceInstaller = (platform: string) =>
  platform === 'mac' || platform === 'windows' || isPhoneInstaller(platform)

export async function createDeviceSetupHandoff(accountId: string) {
  const result = await graphQLRequestWithReason(
    'mutation DeviceSetup($accountId: String!) { createDeviceSetupHandoff(accountId: $accountId) }',
    { accountId }
  )
  if (result === 'ERROR' || 'reason' in result) return undefined
  const handle = result.data?.data?.createDeviceSetupHandoff
  return typeof handle === 'string' && /^[a-f0-9]{48}$/.test(handle) ? handle : undefined
}

export async function readDeviceSetupAccount(handle: string) {
  const result = await graphQLRequestWithReason(
    'query ResumeDeviceSetup($handle: String!) { deviceSetupAccount(handle: $handle) }',
    { handle }
  )
  if (result === 'ERROR' || 'reason' in result) return undefined
  const accountId = result.data?.data?.deviceSetupAccount
  return typeof accountId === 'string' ? accountId : undefined
}

export async function verifyDeviceRegistrationAccount(accountId: string) {
  const result = await graphQLRequestWithReason(
    'query DeviceRegistrationPermission($id: String!) { login { account(id: $id) { canRegisterDevice } } }',
    { id: accountId }
  )
  if (result === 'ERROR') throw new Error('Remote.It could not be reached.')
  if ('reason' in result) throw new Error(result.reason)
  if (result.data?.data?.login?.account?.canRegisterDevice !== true)
    throw new Error('You do not have permission to add devices to this account.')
}
