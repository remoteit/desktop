import React from 'react'
import { ServiceMiniState } from './ServiceMiniState'
import { makeStyles } from '@mui/styles'
import { Chip, Box } from '@mui/material'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../store'

type Props = {
  device?: IDevice
  connections?: IConnection[]
  services?: IService[]
  restore?: boolean
  columns?: string[]
}

const MAX_INDICATORS = 6

export const ServiceIndicators: React.FC<Props> = ({ device, services = [], connections = [] }) => {
  const css = useStyles({ device })
  const { ui } = useDispatch<Dispatch>()

  if (!device?.services.length && !services.length) return null

  services = device?.services.length ? device.services : services
  const extra = Math.max(services.length - MAX_INDICATORS, 0)
  const display = services.slice(0, MAX_INDICATORS)
  const onClick = serviceContextMenu => ui.set({ serviceContextMenu })

  return (
    <Box className={css.indicators}>
      {display.map(service => (
        <ServiceMiniState
          key={service.id}
          service={service}
          connection={connections.find(c => c.id === service.id)}
          onClick={onClick}
        />
      ))}
      {!!extra && <Chip label={`+${extra}`} size="small" />}
    </Box>
  )
}

const useStyles = makeStyles({
  indicators: { position: 'relative', zIndex: 3 },
})
