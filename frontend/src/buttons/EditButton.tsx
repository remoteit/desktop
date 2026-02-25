import { IconButton,Tooltip } from '@mui/material'
import React from 'react'
import { Icon } from '../components/Icon'

type Props = {
  onClick?: () => void
}

export const EditButton: React.FC<Props> = ({ onClick }) => {
  return (
    <Tooltip title="Edit">
      <IconButton onClick={() => onClick && onClick()} size="large">
        <Icon name="pencil" size="md" fixedWidth />
      </IconButton>
    </Tooltip>
  )
}
