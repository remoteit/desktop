import React from 'react'
import { Tooltip, IconButton } from '@material-ui/core'
import { Icon } from '../../components/Icon'

export const CloseButton: React.FC<{ onClick: () => void; className?: string }> = ({ onClick, className }) => {
  return (
    <Tooltip title="Close" className={className}>
      <IconButton onClick={() => onClick()}>
        <Icon name="times" size="md" fixedWidth />
      </IconButton>
    </Tooltip>
  )
}
