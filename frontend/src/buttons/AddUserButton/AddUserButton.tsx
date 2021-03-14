import React from 'react'
import { Link } from 'react-router-dom'
import { IconButton, Tooltip } from '@material-ui/core'
import { Icon } from '../../components/Icon'

export const AddUserButton: React.FC<{ to: string }> = ({ to }) => {
  return (
    <Tooltip title="Share">
      <IconButton to={to} component={Link}>
        <Icon name="user-plus" size="md" />
      </IconButton>
    </Tooltip>
  )
}
