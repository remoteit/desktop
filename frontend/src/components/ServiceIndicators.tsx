import React from 'react'
import { ServiceMiniState } from './ServiceMiniState'
import { Chip, Box, makeStyles } from '@material-ui/core'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../store'

type Props = {
  device?: IDevice
  connections?: IConnection[]
  restore?: boolean
  columns?: string[]
}

const MAX_INDICATORS = 6

export const ServiceIndicators: React.FC<Props> = ({ device, connections = [] }) => {
  const css = useStyles({ device })
  const { ui } = useDispatch<Dispatch>()

  if (!device?.services) return null

  const extra = Math.max(device.services.length - MAX_INDICATORS, 0)
  const display = device.services.slice(0, MAX_INDICATORS)
  return (
    <Box className={css.indicators}>
      {display.map(service => (
        <ServiceMiniState
          key={service.id}
          service={service}
          connection={connections.find(c => c.id === service.id)}
          onClick={serviceContextMenu => ui.set({ serviceContextMenu })}
        />
      ))}
      {!!extra && <Chip label={`+${extra}`} size="small" />}
    </Box>
  )
}

const useStyles = makeStyles({
  indicators: { position: 'relative', zIndex: 3 },
})
