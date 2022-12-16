import React from 'react'
import { Link } from 'react-router-dom'
import { IconButton, Tooltip } from '@mui/material'
import { Icon, IconProps } from '../../components/Icon'

type Props = IconProps & { to: string; hide?: boolean; icon?: string; children?: React.ReactNode }

export const AddUserButton: React.FC<Props> = ({ to, hide, icon, children, ...props }) => {
  if (hide) return null
  return (
    <Tooltip title="Share access">
      <IconButton to={to} component={Link} size="small">
        <Icon name={icon || 'share'} size="md" {...props} />
        {children}
      </IconButton>
    </Tooltip>
  )
}
