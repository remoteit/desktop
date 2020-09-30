import React from 'react'
import { List, ListItemSecondaryAction, Chip, Typography, Tooltip } from '@material-ui/core'
import { ListItemLocation } from './ListItemLocation'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'

export const AccountLinkingSettings: React.FC = () => {
  const { member, access } = useSelector((state: ApplicationState) => state.accounts)

  return (
    <>
      <Typography variant="subtitle1">Account Linking</Typography>
      <List>
        <ListItemLocation
          dense
          icon="users"
          title="Your Members"
          // title="Users linked to your account"
          subtitle="Users with access to the devices you own."
          // subtitle="Link users to your account to grant them access to any devices you own."
          pathname="/settings/access"
        >
          <ListItemSecondaryAction>
            <Tooltip title="Users">
              <Chip label={access.length} size="small" />
            </Tooltip>
          </ListItemSecondaryAction>
        </ListItemLocation>
        <ListItemLocation
          dense
          icon="user-circle"
          title="Your Memberships"
          // title="Account Memberships"
          subtitle="Other accounts that you can access."
          // subtitle="Accounts that have granted you access to the devices they own."
          pathname="/settings/membership"
        >
          <ListItemSecondaryAction>
            <Tooltip title="Accounts">
              <Chip label={member.length} size="small" />
            </Tooltip>
          </ListItemSecondaryAction>
        </ListItemLocation>
      </List>
    </>
  )
}
