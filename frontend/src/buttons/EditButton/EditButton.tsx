import React from 'react'
import { Tooltip, IconButton } from '@material-ui/core'
import { Icon } from '../../components/Icon'

export const EditButton: React.FC<{ onClick?: () => void }> = ({ onClick }) => {
  return (
    <Tooltip title="Edit">
      <IconButton onClick={() => onClick && onClick()}>
        <Icon name="pen" size="md" weight="regular" fixedWidth />
      </IconButton>
    </Tooltip>
  )
}
