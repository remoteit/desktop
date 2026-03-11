import React from 'react'
import { Box } from '@mui/material'
import { EventIcon } from './EventIcon'
import { EventActions, EventState } from './EventMessage'

export type EventFilterOption = {
  key: string
  label: string
  types: IEventType[]
  iconTypes?: IEventType[]
}

export const eventFilterOptions: EventFilterOption[] = [
  {
    key: 'login-activity',
    label: 'Login Activity',
    types: ['AUTH_LOGIN', 'AUTH_LOGIN_ATTEMPT'],
  },
  {
    key: 'password-activity',
    label: 'Password Activity',
    types: ['AUTH_PASSWORD_CHANGE', 'AUTH_PASSWORD_RESET', 'AUTH_PASSWORD_RESET_CONFIRMED'],
    iconTypes: ['AUTH_PASSWORD_CHANGE'],
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

const baseEvent = {
  id: '',
  shared: false,
  scripting: false,
  timestamp: new Date(),
  actor: undefined,
  target: undefined,
  users: undefined,
  devices: undefined,
  job: undefined,
  txBytes: undefined,
  rxBytes: undefined,
  lifetime: undefined,
}

function getEventTypePreviews(type: IEventType, userEmail: string): IEvent[] {
  switch (type) {
    case 'DEVICE_STATE':
      return [
        { ...baseEvent, type, action: '', state: EventState.active as IDevice['state'] },
        { ...baseEvent, type, action: '', state: 'inactive' as IDevice['state'] },
      ]
    case 'DEVICE_CONNECT':
      return [
        { ...baseEvent, type, action: '', state: EventState.connected as IDevice['state'] },
        { ...baseEvent, type, action: '', state: 'inactive' as IDevice['state'] },
      ]
    case 'DEVICE_SHARE':
      return [
        { ...baseEvent, type, action: EventActions[0] },
        { ...baseEvent, type, action: 'delete' },
      ]
    case 'DEVICE_TRANSFER':
      return [
        { ...baseEvent, type, action: '', actor: { email: userEmail } as IUser },
        { ...baseEvent, type, action: '', actor: { email: 'someone-else@example.com' } as IUser },
      ]
    case 'DEVICE_JOB':
    case 'JOB':
      return [
        { ...baseEvent, type, action: 'success' },
        { ...baseEvent, type, action: 'failed' },
      ]
    default:
      return [{ ...baseEvent, type, action: '' }]
  }
}

export function EventTypeIcon({ type, user }: { type: IEventType; user: IUser }) {
  const userEmail = user.email || 'me@example.com'
  const previews = getEventTypePreviews(type, userEmail)

  if (previews.length === 1) {
    return (
      <Box
        sx={{
          width: 20,
          height: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <EventIcon item={previews[0]} loggedInUser={user} />
      </Box>
    )
  }

  return (
    <Box sx={{ position: 'relative', width: 28, height: 20 }}>
      {previews.map((item, index) => (
        <Box
          key={`${type}-${index}`}
          sx={{
            position: 'absolute',
            left: index * 8,
            top: 0,
            width: 20,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.paper',
            borderRadius: '50%',
          }}
        >
          <EventIcon item={item} loggedInUser={user} />
        </Box>
      ))}
    </Box>
  )
}

export function EventFilterIcon({ option, user }: { option: EventFilterOption; user: IUser }) {
  const iconTypes = option.iconTypes || option.types

  if (iconTypes.length === 1) return <EventTypeIcon type={iconTypes[0]} user={user} />

  return (
    <Box sx={{ position: 'relative', width: 28, height: 20 }}>
      {iconTypes.slice(0, 2).map((type, index) => (
        <Box
          key={`${option.key}-${type}`}
          sx={{
            position: 'absolute',
            left: index * 8,
            top: 0,
            width: 20,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.paper',
            borderRadius: '50%',
          }}
        >
          <EventTypeIcon type={type} user={user} />
        </Box>
      ))}
    </Box>
  )
}
