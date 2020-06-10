import React from 'react'
import { List, ListItem, ListItemIcon, ListItemText, Divider } from '@material-ui/core'
import { Duration } from '../Duration'
import { Platform } from '../Platform'
import { Icon } from '../Icon'

interface Props {
  service?: IService | null
  connected?: boolean
}

const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }

export const Users: React.FC<Props> = ({ service, connected }) => {
  if (!service?.access.length) return null

  const users = connected
    ? service.sessions
    : service.access.filter(user => !service.sessions.some(session => user.email === session.email))

  if (!users.length) return null

  return (
    <>
      <List>
        {users.map((user, index) => {
          return (
            <ListItem key={index}>
              <ListItemIcon>
                <Platform id={user.platform} connected={connected} />
              </ListItemIcon>
              {connected ? (
                <ListItemText
                  primaryTypographyProps={{ color: 'primary' }}
                  primary={user.email}
                  secondary={<Duration startTime={user.timestamp?.getTime()} ago />}
                />
              ) : (
                <ListItemText primary={`${user.email}`} />
              )}
            </ListItem>
          )
        })}
      </List>
      <Divider />
    </>
  )
}
