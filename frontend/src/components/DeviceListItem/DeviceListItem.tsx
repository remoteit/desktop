import React from 'react'
import { DeviceLabel } from '../DeviceLabel'
import { ServiceName } from '../ServiceName'
import { RestoreButton } from '../../buttons/RestoreButton'
import { ListItemLocation } from '../ListItemLocation'
import { ServiceMiniState } from '../ServiceMiniState'
import { ConnectionStateIcon } from '../ConnectionStateIcon'
import {
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  Chip,
  makeStyles,
  useMediaQuery,
} from '@material-ui/core'

const MAX_INDICATORS = 6

type Props = {
  device?: IDevice
  connections?: IConnection[]
  thisDevice?: boolean
  restore?: boolean
  setContextMenu: React.Dispatch<React.SetStateAction<IContextMenu>>
}

const ServiceIndicators: React.FC<Props> = ({ device, connections = [], setContextMenu }) => {
  const css = useStyles()
  if (!device?.services) return null
  const extra = Math.max(device.services.length - MAX_INDICATORS, 0)
  const display = device.services.slice(0, MAX_INDICATORS)
  return (
    <>
      {display.map(service => (
        <ServiceMiniState
          key={service.id}
          service={service}
          connection={connections.find(c => c.id === service.id)}
          setContextMenu={setContextMenu}
        />
      ))}
      {!!extra && (
        <Tooltip className={css.chip} title={`${device.services.length} services total`} arrow placement="top">
          <Chip label={`+${extra}`} size="small" />
        </Tooltip>
      )}
    </>
  )
}

export const DeviceListItem: React.FC<Props> = ({ device, connections, thisDevice, setContextMenu, restore }) => {
  const activeConnection = connections && connections.find(c => c.active)
  const largeScreen = useMediaQuery('(min-width:600px)')

  if (!device) return null

  return (
    <ListItemLocation pathname={`/devices/${device.id}`}>
      <DeviceLabel device={device} />
      <ListItemIcon>
        <ConnectionStateIcon device={device} connection={activeConnection} size="lg" thisDevice={thisDevice} />
      </ListItemIcon>
      <ListItemText
        primary={<ServiceName device={device} connection={activeConnection} />}
        secondary={thisDevice && 'This system'}
      />
      {restore ? (
        <ListItemSecondaryAction>
          <RestoreButton device={device} />
        </ListItemSecondaryAction>
      ) : (
        largeScreen && (
          <ListItemSecondaryAction>
            <ServiceIndicators device={device} connections={connections} setContextMenu={setContextMenu} />
          </ListItemSecondaryAction>
        )
      )}
    </ListItemLocation>
  )
}

const useStyles = makeStyles({
  chip: { marginLeft: 6 },
})
