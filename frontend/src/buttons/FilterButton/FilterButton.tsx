import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Tooltip, IconButton, Badge } from '@material-ui/core'
import { state as defaults } from '../../models/devices'
import { ApplicationState, Dispatch } from '../../store'
import { Icon } from '../../components/Icon'

export const FilterButton: React.FC = () => {
  const { open, changed } = useSelector((state: ApplicationState) => ({
    open: state.ui.filterMenu,
    changed:
      state.devices.filter !== defaults.filter ||
      state.devices.sort !== defaults.sort ||
      state.devices.owner !== defaults.owner,
  }))
  const { ui } = useDispatch<Dispatch>()

  return (
    <Tooltip title={open ? 'Hide filters' : 'Show filters'}>
      <IconButton onClick={() => ui.set({ filterMenu: !open })}>
        {changed ? (
          <Badge variant="dot" color="primary">
            <Icon name="filter" size="base" type="regular" />
          </Badge>
        ) : (
          <Icon name="filter" size="base" type="regular" />
        )}
      </IconButton>
    </Tooltip>
  )
}
