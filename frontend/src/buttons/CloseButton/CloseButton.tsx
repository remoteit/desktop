import React from 'react'
import { Tooltip, IconButton } from '@mui/material'
import { Icon } from '../../components/Icon'

export const CloseButton: React.FC<{ onClick: () => void; className?: string }> = ({ onClick, className }) => {
  return (
    <Tooltip title="Close" className={className}>
      <IconButton onClick={() => onClick()} size="large">
        <Icon name="times" size="md" fixedWidth />
      </IconButton>
    </Tooltip>
  )
}
