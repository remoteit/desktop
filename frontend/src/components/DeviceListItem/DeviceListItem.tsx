import React from 'react'
import { ServiceName } from '../ServiceName'
import { ListItemLocation } from '../ListItemLocation'
import { ServiceMiniState } from '../ServiceMiniState'
import { ConnectionStateIcon } from '../ConnectionStateIcon'
import { ListItemIcon, ListItemText, ListItemSecondaryAction } from '@material-ui/core'

type Props = {
  device?: IDevice
  connections?: IConnection[]
  thisDevice?: boolean
}

const ServiceIndicators: React.FC<Props> = ({ device, connections = [] }) => {
  if (!device?.services) return null
  return (
    <>
      {device.services.map(service => (
        <ServiceMiniState key={service.id} service={service} connection={connections.find(c => c.id === service.id)} />
      ))}
    </>
  )
}

export const DeviceListItem: React.FC<Props> = ({ device, connections, thisDevice }) => {
  const activeConnection = connections && connections.find(c => c.active)

  return (
    <ListItemLocation pathname={`/devices/${device?.id}`}>
      <ListItemIcon>
        <ConnectionStateIcon service={device} connection={activeConnection} size="lg" thisDevice={thisDevice} />
      </ListItemIcon>
      <ListItemText
        primary={<ServiceName service={device} shared={device?.shared} connection={activeConnection} />}
        secondary={thisDevice && 'This system'}
      />
      <ListItemSecondaryAction style={{ right: 90 }}>
        <ServiceIndicators device={device} connections={connections} />
      </ListItemSecondaryAction>
    </ListItemLocation>
  )
}
