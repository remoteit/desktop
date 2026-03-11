import React from 'react'
import { Box } from '@mui/material'
import { EventIcon } from './EventIcon'

type Props = {
  item: IEvent
  user: IUser
}

export function EventTypeIcon({ item, user }: Props) {
  return (
    <Box
      sx={{
        width: 20,
        height: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <EventIcon item={item} loggedInUser={user} />
    </Box>
  )
}
