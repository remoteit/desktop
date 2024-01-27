import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { State, Dispatch } from '../../store'
import { Tooltip, IconButton } from '@mui/material'
import { selectIsFiltered } from '../../selectors/devices'
import { Icon } from '../../components/Icon'

export const FilterButton: React.FC = () => {
  const modified = useSelector(selectIsFiltered)
  const open = useSelector((state: State) => state.ui.drawerMenu === 'FILTER')
  const { ui } = useDispatch<Dispatch>()
  const icon = open ? 'times' : 'filter'
  return (
    <Tooltip
      placement="left"
      title={open ? 'Hide Filters' : 'Show Filters'}
      sx={{
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: open ? 'grayLighter.main' : 'white.main',
        borderBottomWidth: 0,
        paddingBottom: 2,
        marginTop: 0.5,
        bgcolor: open ? 'white.main' : undefined,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
      }}
      arrow
    >
      <IconButton
        onClick={event => {
          event.stopPropagation()
          ui.set({ drawerMenu: open ? null : 'FILTER' })
        }}
        size="large"
      >
        <Icon name={icon} size="base" type="regular" modified={modified} fixedWidth />
      </IconButton>
    </Tooltip>
  )
}
