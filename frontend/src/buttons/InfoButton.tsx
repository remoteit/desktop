import React from 'react'
import { useHistory } from 'react-router-dom'
import { Tooltip, IconButton } from '@mui/material'
import { Icon } from '../components/Icon'

type Props = {
  device: IDevice
  service?: IService
  onClick?: () => void
}

export const InfoButton: React.FC<Props> = ({ onClick, device, service }) => {
  const history = useHistory()
  const instance = device || service

  let title = 'Details'
  if (service) title = 'Service Details'
  else if (device) title = 'Device Details'

  if (instance)
    onClick = () => {
      let path = `/devices/${device?.id}`
      if (service) path += `/${service.id}/edit`
      history.push(path)
    }

  return (
    <Tooltip title={title}>
      <IconButton onClick={onClick} size="large">
        {/* <Icon name="neuter" size="md" rotate={90} fixedWidth /> */}
        <Icon name="bullseye" size="md" fixedWidth />
      </IconButton>
    </Tooltip>
  )
}
