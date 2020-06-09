import React from 'react'
import { Tooltip, IconButton } from '@material-ui/core'
import { Icon } from '../../components/Icon'

export const ResetButton: React.FC<{ onClick?: () => void }> = ({ onClick }) => {
  return (
    <Tooltip title="Reset">
      <IconButton onClick={() => onClick && onClick()}>
        <Icon name="undo" size="md" type="regular" fixedWidth />
      </IconButton>
    </Tooltip>
  )
}
