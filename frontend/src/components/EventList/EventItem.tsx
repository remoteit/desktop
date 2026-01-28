import React from 'react'
import { ListItem, ListItemIcon } from '@mui/material'
import { EventIcon } from './EventIcon'
import { EventMessage } from './EventMessage'

const options: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
}

export function EventItem({ item, device, user }: { item: IEvent; device?: IDevice; user: IUser }) {
  // Filter refresh events - eventually we need to exclude these in the API query
  if (item.type === 'DEVICE_REFRESH') return null
  return (
    <ListItem>
      <span>{new Date(item.timestamp).toLocaleString(navigator.language, options)}</span>
      <ListItemIcon>
        <EventIcon item={item} loggedInUser={user} />
      </ListItemIcon>
      <EventMessage item={item} device={device} loggedInUser={user} />
    </ListItem>
  )
}
