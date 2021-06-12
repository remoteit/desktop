import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Tooltip, IconButton, Badge } from '@material-ui/core'
import { defaultState } from '../../models/devices'
import { ApplicationState, Dispatch } from '../../store'
import { Icon } from '../../components/Icon'

export const FilterButton: React.FC = () => {
  const { open, changed } = useSelector((state: ApplicationState) => ({
    open: state.ui.drawerMenu === 'FILTER',
    changed:
      state.devices.filter !== defaultState.filter ||
      state.devices.sort !== defaultState.sort ||
      state.devices.owner !== defaultState.owner,
  }))
  const { ui } = useDispatch<Dispatch>()

  return (
    <Tooltip title={open ? 'Hide filters' : 'Show filters'}>
      <IconButton onClick={() => ui.set({ drawerMenu: open ? null : 'FILTER' })}>
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
