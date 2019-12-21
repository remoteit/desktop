import React from 'react'
import { IDevice } from 'remote.it'
import { useSelector } from 'react-redux'
import { ServiceName } from '../ServiceName'
import { ApplicationState } from '../../store'
import { ListItemLocation } from '../ListItemLocation'
import { ServiceMiniState } from '../ServiceMiniState'
import { ConnectionStateIcon } from '../ConnectionStateIcon'
import { ListItemIcon, ListItemText, ListItemSecondaryAction } from '@material-ui/core'

type Props = {
  device: IDevice
  connections?: IConnection[]
}

const ServiceIndicators: React.FC<Props> = ({ device, connections = [] }) => {
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

export const DeviceListItem = ({ device, connections }: Props) => {
  const myDevice = useSelector((state: ApplicationState) => state.backend.device)
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
        secondary={myDevice.uid === device.id && 'This system'}
      />
      <ListItemSecondaryAction style={{ right: 90 }}>
        <ServiceIndicators device={device} connections={connections} />
      </ListItemSecondaryAction>
    </ListItemLocation>
  )
}
