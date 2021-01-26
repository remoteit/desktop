import React from 'react'
import { ListItemSecondaryAction, Chip } from '@material-ui/core'
import { ListItemLocation } from './ListItemLocation'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'

export const NoticesSetting: React.FC = () => {
  const { access } = useSelector((state: ApplicationState) => state.accounts)

  return (
    <ListItemLocation dense icon="bell" title="Notifications" pathname="/settings/notifications">
      <ListItemSecondaryAction>
        <Chip label={2} size="small" />
      </ListItemSecondaryAction>
    </ListItemLocation>
  )
}
