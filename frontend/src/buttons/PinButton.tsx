import React from 'react'
import { Tooltip, IconButton } from '@material-ui/core'
import { Icon } from '../components/Icon'

export const PinButton: React.FC<{ onClick: () => void; className?: string }> = ({ onClick, className }) => {
  return (
    <Tooltip title="Pin" className={className}>
      <IconButton onClick={() => onClick()}>
        <Icon name="thumbtack" type="regular" size="base" color="grayDark" />
      </IconButton>
    </Tooltip>
  )
}
