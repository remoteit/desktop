import React from 'react'
import { EventFilterOption } from './eventTypes'
import { getEventTypePreviewItems } from './eventTypePreviewItems'
import { EventTypeIconStack } from './EventTypeIconStack'

type Props = {
  option: EventFilterOption
  user: IUser
  selected?: boolean
}

export function EventFilterIcon({ option, user, selected }: Props) {
  const userEmail = user.email || 'me@example.com'
  const iconTypes = option.iconTypes || option.types
  const items = iconTypes.flatMap(type => getEventTypePreviewItems(type, userEmail).slice(0, 1))

  if (iconTypes.length === 1) {
    const singleTypeItems = getEventTypePreviewItems(iconTypes[0], userEmail)
    return <EventTypeIconStack items={singleTypeItems} user={user} selected={selected} spacing={8} />
  }

  return <EventTypeIconStack items={items} user={user} selected={selected} spacing={10} />
}
