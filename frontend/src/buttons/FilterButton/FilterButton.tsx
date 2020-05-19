import React from 'react'
import { Tooltip, IconButton } from '@material-ui/core'
import { Dispatch, ApplicationState } from '../../store'
import { useDispatch, useSelector } from 'react-redux'
import { Icon } from '../../components/Icon'
import { spacing, Color } from '../../styling'

export const FilterButton: React.FC<{}> = () => {
  const { filter } = useSelector((state: ApplicationState) => state.devices)
  const { devices } = useDispatch<Dispatch>()

  let title: string, icon: string, color: Color, next: string

  switch (filter) {
    case 'active':
      title = 'Showing online devices'
      icon = 'check-circle'
      color = 'success'
      next = 'inactive'
      break
    case 'inactive':
      title = 'Showing offline devices'
      icon = 'minus-circle'
      color = 'grayLight'
      next = 'all'
      break
    default:
      title = 'Showing all devices'
      icon = 'filter'
      color = 'grayDarker'
      next = 'active'
      break
  }

  return (
    <Tooltip title={title}>
      <IconButton
        onClick={() => {
          devices.set({ filter: next, from: 0 })
          devices.fetch()
        }}
      >
        <Icon name={icon} color={color} size="base" weight="regular" />
      </IconButton>
    </Tooltip>
  )
}
