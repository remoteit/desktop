import React from 'react'
import { MenuItem, ListItemIcon, ListItemText } from '@mui/material'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../store'
import { Icon } from './Icon'

type Props = {
  connection?: IConnection
  onClick?: () => void
}

export const ForgetMenuItem: React.FC<Props> = ({ connection, onClick }) => {
  const dispatch = useDispatch<Dispatch>()
  const disabled = !connection || connection.default

  const forget = () => {
    if (connection) dispatch.connections.forget(connection.id)
    onClick?.()
  }

  return (
    <MenuItem dense disabled={disabled} onClick={forget}>
      <ListItemIcon>
        <Icon name="undo" size="md" />
      </ListItemIcon>
      <ListItemText primary="Reset Settings" />
    </MenuItem>
  )
}
