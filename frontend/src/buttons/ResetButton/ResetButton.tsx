import React from 'react'
import { Tooltip, IconButton } from '@material-ui/core'
import { Icon } from '../../components/Icon'

export const ResetButton: React.FC<{ onClick?: () => void; onMouseDown?: () => void }> = props => {
  return (
    <Tooltip title="Reset">
      <IconButton {...props}>
        <Icon name="undo" size="md" fixedWidth />
      </IconButton>
    </Tooltip>
  )
}
