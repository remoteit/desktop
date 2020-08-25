import React from 'react'
import { DeviceLabel } from '../DeviceLabel'
import { ServiceName } from '../ServiceName'
import { ListItemLocation } from '../ListItemLocation'
import { ServiceMiniState } from '../ServiceMiniState'
import { ConnectionStateIcon } from '../ConnectionStateIcon'
import { ListItemIcon, ListItemText, ListItemSecondaryAction, Tooltip, Chip, makeStyles } from '@material-ui/core'

const MAX_INDICATORS = 10

type Props = {
  device?: IDevice
  connections?: IConnection[]
  thisDevice?: boolean
}

const ServiceIndicators: React.FC<Props> = ({ device, connections = [] }) => {
  const css = useStyles()
  if (!device?.services) return null
  const extra = Math.max(device.services.length - MAX_INDICATORS, 0)
  const display = device.services.slice(0, MAX_INDICATORS)
  return (
    <>
      {display.map(service => (
        <ServiceMiniState key={service.id} service={service} connection={connections.find(c => c.id === service.id)} />
      ))}
      {!!extra && (
        <Tooltip className={css.chip} title={`${device.services.length} services total`}>
          <Chip label={`+${extra}`} size="small" />
        </Tooltip>
      )}
    </>
  )
}

export const DeviceListItem: React.FC<Props> = ({ device, connections, thisDevice }) => {
  const activeConnection = connections && connections.find(c => c.active)

  if (!device) return null

  return (
    <ListItemLocation pathname={`/devices/${device.id}`}>
      <DeviceLabel device={device} />
      <ListItemIcon>
        <ConnectionStateIcon service={device} connection={activeConnection} size="lg" thisDevice={thisDevice} />
      </ListItemIcon>
      <ListItemText
        primary={<ServiceName device={device} connection={activeConnection} />}
        secondary={thisDevice && 'This system'}
      />
      <ListItemSecondaryAction style={{ right: 90 }}>
        <ServiceIndicators device={device} connections={connections} />
      </ListItemSecondaryAction>
    </ListItemLocation>
  )
}

const useStyles = makeStyles({
  chip: { marginLeft: 6 },
})
