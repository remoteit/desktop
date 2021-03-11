import React from 'react'
import { DynamicButton } from '../DynamicButton'
import { Fade } from '@material-ui/core'

type Props = {
  service?: IService
  connection?: IConnection
  size?: 'icon' | 'medium' | 'small' | 'large'
  fullWidth?: boolean
}

export const OfflineButton: React.FC<Props> = ({ service, fullWidth, size = 'small' }) => {
  const hidden = service?.state === 'active'
  return (
    <Fade in={!hidden} timeout={600}>
      <div>
        <DynamicButton title="Offline" disabled={true} size={size} onClick={() => {}} fullWidth={fullWidth} />
      </div>
    </Fade>
  )
}
