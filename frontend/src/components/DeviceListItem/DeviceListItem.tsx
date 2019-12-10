import React from 'react'
import { IDevice } from 'remote.it'
import { ServiceName } from '../ServiceName'
import { ListItemLocation } from '../ListItemLocation'
import { ServiceMiniState } from '../ServiceMiniState'
import { ConnectionStateIcon } from '../ConnectionStateIcon'
import { ListItemIcon, ListItemText, ListItemSecondaryAction } from '@material-ui/core'

const ServiceIndicators: React.FC<{ device: IDevice; connections?: IConnection[] }> = ({
  device,
  connections = [],
}) => {
  return (
    <>
      {device.services.map(service => (
        <ServiceMiniState
          key={service.id}
          service={service}
          connection={connections.find(c => c.id === service.id)}
          pathname={`/devices/${device.id}/${service.id}`}
        />
      ))}
    </>
  )
}

export type DeviceListItemProps = {
  device: IDevice
  connections?: IConnection[]
}

export const DeviceListItem = ({ device, connections }: DeviceListItemProps) => {
  const activeConnection = connections && connections.find(c => c.active)
  return (
    <ListItemLocation pathname={`/devices/${device.id}`}>
      <ListItemIcon>
        <ConnectionStateIcon service={device} connection={activeConnection} size="lg" />
      </ListItemIcon>
      <ListItemText
        primary={
          <ServiceName service={device} shared={device.shared === 'shared-from'} connection={activeConnection} />
        }
      />
      <ListItemSecondaryAction style={{ right: 90 }}>
        <ServiceIndicators device={device} connections={connections} />
      </ListItemSecondaryAction>
    </ListItemLocation>
  )
}
