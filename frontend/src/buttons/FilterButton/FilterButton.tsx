import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { State, Dispatch } from '../../store'
import { Tooltip, IconButton } from '@mui/material'
import { selectIsFiltered } from '../../selectors/devices'
import { Icon } from '../../components/Icon'

export const FilterButton: React.FC = () => {
  const modified = useSelector(selectIsFiltered)
  const drawerMenu = useSelector((state: State) => state.ui.drawerMenu)
  const open = drawerMenu === 'FILTER'
  const { ui } = useDispatch<Dispatch>()
  const icon = open ? 'times' : 'filter'

  return (
    <Tooltip
      enterDelay={500}
      title={open ? 'Hide Filters' : 'Show Filters'}
      arrow
    >
      <IconButton
        onClick={event => {
          event.stopPropagation()
          ui.set({ drawerMenu: open ? null : 'FILTER' })
        }}
        size="large"
      >
        <Icon name={icon} size="md" type="regular" modified={modified} fixedWidth />
      </IconButton>
    </Tooltip>
  )
}
