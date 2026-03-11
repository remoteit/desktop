import React, { useMemo, useState } from 'react'
import { Divider, Menu } from '@mui/material'
import { State } from '../../store'
import { useSelector } from 'react-redux'
import { Icon } from '../Icon'
import { IconButton } from '../../buttons/IconButton'
import { eventFilterOptions } from './eventTypes'
import { EventFilterIcon } from './EventFilterIcon'
import { EventTypeFilterMenuItem } from './EventTypeFilterMenuItem'

type Props = {
  value?: IEventType[]
  onChange: (value?: IEventType[]) => void
}

export const EventTypeFilterMenu: React.FC<Props> = ({ value, onChange }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const user = useSelector((state: State) => state.user)
  const selectedValues = value || []
  const activeTypes = useMemo(() => new Set(selectedValues), [selectedValues])
  const isFiltered = selectedValues.length > 0

  const handleToggle = (types?: IEventType[]) => {
    if (!types?.length) {
      onChange(undefined)
      return
    }

    const next = new Set(activeTypes)
    const isSelected = types.every(type => next.has(type))

    if (isSelected) types.forEach(type => next.delete(type))
    else types.forEach(type => next.add(type))

    onChange(next.size ? Array.from(next) : undefined)
  }

  return (
    <>
      <IconButton
        title="Filter events"
        name="filter"
        color="grayDarker"
        modified={isFiltered}
        onClick={event => setAnchorEl(event.currentTarget as HTMLButtonElement)}
      />
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        disableScrollLock
        autoFocus={false}
        elevation={2}
      >
        <EventTypeFilterMenuItem
          label="All"
          selected={!isFiltered}
          onClick={() => handleToggle(undefined)}
          icon={<Icon name="asterisk" size="md" color={!isFiltered ? 'primary' : 'gray'} />}
        />
        <Divider />
        {eventFilterOptions.map(option => {
          const selected = option.types.every(type => activeTypes.has(type))

          return (
            <EventTypeFilterMenuItem
              key={option.key}
              label={option.label}
              selected={selected}
              onClick={() => handleToggle(option.types)}
              icon={<EventFilterIcon option={option} user={user} selected={selected} />}
            />
          )
        })}
      </Menu>
    </>
  )
}
