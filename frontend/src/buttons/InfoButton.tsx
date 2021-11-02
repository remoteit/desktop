import React from 'react'
import { useHistory } from 'react-router-dom'
import { Tooltip, IconButton } from '@material-ui/core'
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
      if (service) path += `/${service.id}`
      history.push(path)
    }

  return (
    <Tooltip title={title}>
      <IconButton onClick={() => onClick && onClick()}>
        {/* <Icon name="neuter" size="md" rotate={90} fixedWidth /> */}
        <Icon name="hdd" size="md" fixedWidth />
      </IconButton>
    </Tooltip>
  )
}
