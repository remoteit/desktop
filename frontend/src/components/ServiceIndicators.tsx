import React from 'react'
import { ServiceMiniState } from './ServiceMiniState'
import { Tooltip, Chip, Box, makeStyles } from '@material-ui/core'

type Props = {
  device?: IDevice
  connections?: IConnection[]
  thisDevice?: boolean
  restore?: boolean
  setContextMenu?: React.Dispatch<React.SetStateAction<IContextMenu>>
  columns?: string[]
}

const MAX_INDICATORS = 6

export const ServiceIndicators: React.FC<Props> = ({ device, connections = [], setContextMenu }) => {
  const css = useStyles()
  if (!device?.services) return null
  const extra = Math.max(device.services.length - MAX_INDICATORS, 0)
  const display = device.services.slice(0, MAX_INDICATORS)
  return (
    <Box>
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
    </Box>
  )
}

const useStyles = makeStyles({
  chip: { marginLeft: 6 },
})
