import React from 'react'
import { List, ListItemSecondaryAction, Chip, Typography, Tooltip } from '@material-ui/core'
import { ListItemLocation } from './ListItemLocation'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'

export const AccountLinkingSettings: React.FC = () => {
  const { member, access } = useSelector((state: ApplicationState) => state.accounts)

  return (
    <ListItemLocation
      dense
      icon="user-friends"
      title="Device List Sharing"
      subtitle="Share all the devices you own to another user"
      pathname="/settings/access"
    >
      <ListItemSecondaryAction>
        <Chip label={`${access.length} users`} size="small" />
      </ListItemSecondaryAction>
    </ListItemLocation>
  )
}
