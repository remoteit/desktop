import React from 'react'
import { useSelector } from 'react-redux'
import { ListItemIcon, ListItemText, ListItemSecondaryAction, Typography } from '@material-ui/core'
import { ApplicationState } from '../../store'
import { ListItemLocation } from '../ListItemLocation'
import { useLocation } from 'react-router-dom'
import { Icon } from '../Icon'

type Props = {
  connection?: IConnection
}

export const ConnectionLog: React.FC<Props> = ({ connection }) => {
  const location = useLocation()
  const id = connection ? connection.id : ''
  const log = useSelector((state: ApplicationState) => state.logs[id])
  const disabled: boolean = !log

  return (
    <ListItemLocation disabled={disabled} pathname={location.pathname + '/log'}>
      <ListItemIcon>
        <Icon name="stream" size="md" weight="light" />
      </ListItemIcon>
      <ListItemText primary="Raw Connection Log" />
      {disabled && (
        <ListItemSecondaryAction>
          <Typography variant="caption">EMPTY</Typography>
        </ListItemSecondaryAction>
      )}
    </ListItemLocation>
  )
}
