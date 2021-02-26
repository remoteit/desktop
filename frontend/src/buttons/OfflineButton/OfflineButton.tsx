import React from 'react'
import { DynamicButton } from '../DynamicButton'
import { Fade } from '@material-ui/core'

type Props = {
  service?: IService
  connection?: IConnection
  size?: 'icon' | 'medium' | 'small'
}

export const OfflineButton: React.FC<Props> = ({ service, connection, size = 'small' }) => {
  const hidden = service?.state === 'active' || connection?.connected
  return (
    <Fade in={!hidden} timeout={600}>
      <div>
        <DynamicButton title="Offline" disabled={true} size={size} icon="none" onClick={() => {}} />
      </div>
    </Fade>
  )
}
