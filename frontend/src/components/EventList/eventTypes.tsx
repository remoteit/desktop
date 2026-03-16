export type EventFilterOption = {
  key: string
  label: string
  types: IEventType[]
  iconTypes?: IEventType[]
}

export const deviceHiddenEventFilterOptionKeys = new Set([
  'login-activity',
  'password-activity',
  'phone-change',
  'mfa-change',
  'license-updated',
])

export const eventFilterOptions: EventFilterOption[] = [
  {
    key: 'login-activity',
    label: 'Login Activity',
    types: ['AUTH_LOGIN', 'AUTH_LOGIN_ATTEMPT'],
  },
  {
    key: 'password-activity',
    label: 'Password Reset',
    types: ['AUTH_PASSWORD_RESET'],
  },
  { key: 'phone-change', label: 'Phone Change', types: ['AUTH_PHONE_CHANGE'] },
  {
    key: 'mfa-change',
    label: 'MFA Change',
    types: ['AUTH_MFA_ENABLED', 'AUTH_MFA_DISABLED'],
  },
  { key: 'license-updated', label: 'License Updated', types: ['LICENSE_UPDATED'] },
  { key: 'device-state', label: 'Device State', types: ['DEVICE_STATE'] },
  { key: 'device-connect', label: 'Device Connection', types: ['DEVICE_CONNECT'] },
  { key: 'device-delete', label: 'Device Deleted', types: ['DEVICE_DELETE'] },
  { key: 'device-share', label: 'Device Shared', types: ['DEVICE_SHARE'] },
  { key: 'device-transfer', label: 'Device Transferred', types: ['DEVICE_TRANSFER'] },
  { key: 'device-job', label: 'Device Script Run', types: ['DEVICE_JOB'] },
  { key: 'job', label: 'Script Run', types: ['JOB'] },
]
