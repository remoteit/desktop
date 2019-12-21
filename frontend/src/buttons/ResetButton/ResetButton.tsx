import React from 'react'
import { Tooltip, IconButton } from '@material-ui/core'
import { Icon } from '../../components/Icon'
import { spacing } from '../../styling'

export const ResetButton: React.FC<{ onClick?: () => void }> = ({ onClick }) => {
  return (
    <Tooltip title="Reset" style={{ margin: spacing.sm }}>
      <IconButton onClick={() => onClick && onClick()}>
        <Icon name="undo" size="md" weight="regular" fixedWidth />
      </IconButton>
    </Tooltip>
  )
}
