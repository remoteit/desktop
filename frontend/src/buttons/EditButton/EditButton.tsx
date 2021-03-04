import React from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { Tooltip, IconButton } from '@material-ui/core'
import { Icon } from '../../components/Icon'

type Props = {
  device: IDevice
  service?: IService
  connection?: IConnection
  onClick?: () => void
}

export const EditButton: React.FC<Props> = ({ onClick, device, service, connection }) => {
  const history = useHistory()
  const instance = device || service

  let title = 'Configure'
  if (service) title += ' Service'
  else if (device) title += ' Device'

  if ((service && device?.shared) || connection?.connected) return null
  if (instance)
    onClick = () => {
      let path = `/devices/${device?.id}`
      if (service) path += `/${service.id}`
      history.push(path)
    }

  return (
    <Tooltip title={title}>
      <IconButton onClick={() => onClick && onClick()}>
        <Icon name="cog" size="md" fixedWidth />
      </IconButton>
    </Tooltip>
  )
}
