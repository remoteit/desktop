import React from 'react'
import { Box } from '@mui/material'
import { EventTypeIcon } from './EventTypeIcon'

type Props = {
  items: IEvent[]
  user: IUser
  selected?: boolean
  spacing?: number
}

export function EventTypeIconStack({ items, user, selected, spacing = 10 }: Props) {
  if (items.length <= 1) return <EventTypeIcon item={items[0]} user={user} />

  return (
    <Box sx={{ position: 'relative', width: 28, height: 20 }}>
      {items.slice(0, 2).map((item, index) => (
        <Box
          key={`${item.type}-${item.action}-${item.state || index}`}
          sx={{
            position: 'absolute',
            left: index * spacing,
            top: 0,
            width: 20,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: selected ? 'primaryHighlight.main' : 'grayLightest.main',
            borderRadius: '50%',
          }}
        >
          <EventTypeIcon item={item} user={user} />
        </Box>
      ))}
    </Box>
  )
}
