import React from 'react'
import { useHistory } from 'react-router-dom'
import { ListItem, ListItemIcon, ListItemText } from '@mui/material'
import { Icon } from './Icon'

export type Props = {
  title?: string
  children?: React.ReactNode
}

export const ListItemBack: React.FC<Props> = ({ title, children, ...props }) => {
  const history = useHistory()
  return (
    <ListItem dense disableGutters {...props} button onClick={() => history.goBack()}>
      <ListItemIcon>
        <Icon name="angle-left" size="md" fixedWidth />
      </ListItemIcon>
      <ListItemText primary={title || 'Back'} />
      {children}
    </ListItem>
  )
}
