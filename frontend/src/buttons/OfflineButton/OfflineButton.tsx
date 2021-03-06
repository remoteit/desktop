import React from 'react'
import { DynamicButton } from '../DynamicButton'
import { Fade } from '@material-ui/core'

type Props = {
  service?: IService
  connection?: IConnection
}

export const OfflineButton: React.FC<Props> = ({ service, connection }) => {
  console.log('OFFLINE BUTTON', service?.state, connection?.connected)
  const hidden = service?.state === 'active'
  return (
    <Fade in={!hidden} timeout={600}>
      <div>
        <DynamicButton title="Offline" disabled={true} size="small" icon="none" onClick={() => {}} />
      </div>
    </Fade>
  )
}
