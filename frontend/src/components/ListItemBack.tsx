import React from 'react'
import { useHistory } from 'react-router-dom'
import { ListItemButtonProps, ListItemButton, ListItemIcon, ListItemText } from '@mui/material'
import { Icon } from './Icon'

export type Props = ListItemButtonProps & {
  to: string
  title?: string
}

export const ListItemBack: React.FC<Props> = ({ to, title, children, ...props }) => {
  const history = useHistory()
  return (
    <ListItemButton dense disableGutters {...props} onClick={() => history.push(to)}>
      <ListItemIcon>
        <Icon name="angle-left" size="md" fixedWidth />
      </ListItemIcon>
      <ListItemText primary={title || 'Back'} />
      {children}
    </ListItemButton>
  )
}
