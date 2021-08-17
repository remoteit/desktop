import React from 'react'
import { Link } from 'react-router-dom'
import { IconButton, Tooltip } from '@material-ui/core'
import { Icon } from '../../components/Icon'

export const AddUserButton: React.FC<{ to: string; hide?: boolean }> = ({ to, hide }) => {
  if (hide) return null
  return (
    <Tooltip title="Share">
      <IconButton to={to} component={Link}>
        <Icon name="user-plus" size="md" />
      </IconButton>
    </Tooltip>
  )
}
