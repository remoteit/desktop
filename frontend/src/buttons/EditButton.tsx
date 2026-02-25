import React from 'react'
import { Tooltip, IconButton } from '@mui/material'
import { Icon } from '../components/Icon'

type Props = {
  className?: string
  onClick?: () => void
}

export const EditButton: React.FC<Props> = ({ className, onClick }) => {
  return (
    <Tooltip title="Edit">
      <IconButton
        className={className}
        onClick={event => {
          event.stopPropagation()
          onClick?.()
        }}
        size="large"
      >
        <Icon name="pencil" size="md" fixedWidth />
      </IconButton>
    </Tooltip>
  )
}
