import { EventActions, EventState } from './EventMessage'

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

export function getEventTypePreviewItems(type: IEventType, userEmail: string): IEvent[] {
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
