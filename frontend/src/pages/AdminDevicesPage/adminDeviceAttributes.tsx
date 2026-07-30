import { Attribute } from '../../components/Attributes'
import { AdminDevice } from '../../models/adminDevices'

export type AdminDeviceAttributeOptions = {
  device?: AdminDevice
}

export class AdminDeviceAttribute extends Attribute<AdminDeviceAttributeOptions> {
  type: Attribute['type'] = 'MASTER'
}

export const adminDeviceAttributes: AdminDeviceAttribute[] = [
  new AdminDeviceAttribute({
    id: 'deviceName',
    label: 'Name',
    defaultWidth: 250,
    required: true,
    value: ({ device }: AdminDeviceAttributeOptions) => device?.name || '-',
  }),
  new AdminDeviceAttribute({
    id: 'deviceState',
    label: 'State',
    defaultWidth: 100,
    value: ({ device }: AdminDeviceAttributeOptions) => device?.state || '-',
  }),
  new AdminDeviceAttribute({
    id: 'deviceOwner',
    label: 'Owner',
    defaultWidth: 250,
    value: ({ device }: AdminDeviceAttributeOptions) => device?.owner?.email || '-',
  }),
  new AdminDeviceAttribute({
    id: 'deviceId',
    label: 'Device ID',
    defaultWidth: 320,
    value: ({ device }: AdminDeviceAttributeOptions) => device?.id,
  }),
  new AdminDeviceAttribute({
    id: 'deviceCreated',
    label: 'Created',
    defaultWidth: 150,
    value: ({ device }: AdminDeviceAttributeOptions) =>
      device?.created ? new Date(device.created).toLocaleDateString() : '-',
  }),
]
