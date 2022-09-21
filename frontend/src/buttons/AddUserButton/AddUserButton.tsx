import React from 'react'
import { Link } from 'react-router-dom'
import { IconButton, Tooltip } from '@mui/material'
import { Icon, IconProps } from '../../components/Icon'

type Props = IconProps & { to: string; hide?: boolean; children?: React.ReactNode }

export const AddUserButton: React.FC<Props> = ({ to, hide, children, ...props }) => {
  if (hide) return null
  return (
    <Tooltip title="Share">
      <IconButton to={to} component={Link}>
        <Icon name="user-plus" size="md" {...props} />
        {children}
      </IconButton>
    </Tooltip>
  )
}
