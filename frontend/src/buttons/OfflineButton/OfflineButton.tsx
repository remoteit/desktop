import React from 'react'
import { DynamicButton } from '../DynamicButton'
import { Fade } from '@material-ui/core'

type Props = {
  service?: IService
}

export const OfflineButton: React.FC<Props> = ({ service }) => {
  const hidden = service && service.state === 'active'
  return (
    <Fade in={!hidden} timeout={600}>
      <div>
        <DynamicButton title="Offline" disabled={true} size="small" icon="none" onClick={() => {}} />
      </div>
    </Fade>
  )
}
