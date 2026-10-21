import React from 'react'
import { ServiceMiniState } from './ServiceMiniState'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Chip, Box } from '@mui/material'
import { ColorChip } from './ColorChip'

type Props = {
  device?: IDevice
  connections?: IConnection[]
  services?: IService[]
  restore?: boolean
  columns?: string[]
}

const MAX_INDICATORS = 6

export const ServiceIndicators: React.FC<Props> = ({ device, services = [], connections = [] }) => {
  const { t } = useTranslation()
  const history = useHistory()

  if (!device?.services.length && !services.length && !device?.hosts) return null

  services = device?.services.length ? device.services : services
  const extra = Math.max(services.length - MAX_INDICATORS, 0)
  const display = services.slice(0, MAX_INDICATORS)

  return (
    <Box zIndex={3} position="relative" onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
      {display.map(service => (
        <ServiceMiniState
          key={service.id}
          service={service}
          connection={connections.find(c => c.id === service.id)}
          onClick={() => history.push(`/devices/${service.deviceID}/${service.id}/connect`)}
        />
      ))}
      {!!extra && <Chip label={`+${extra}`} size="small" />}
      {/* A gateway: how many virtual devices it hosts that the viewer can see. */}
      {!!device?.hosts && (
        <ColorChip
          label={t('serviceIndicators.hosts', { count: device.hosts, defaultValue: 'hosts {{count}}' })}
          size="small"
          color="primary"
          onClick={() => history.push(`/devices/${device.id}`)}
          sx={{ marginLeft: 0.5 }}
        />
      )}
    </Box>
  )
}
