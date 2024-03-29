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
      sx={{
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: open ? 'grayLighter.main' : 'white.main',
        borderBottomWidth: 0,
        paddingBottom: 2,
        marginTop: 0.5,
        bgcolor: open ? 'white.main' : undefined,
        borderBottomLeftRadius: open ? 0 : undefined,
        borderBottomRightRadius: open ? 0 : undefined,
        '&:hover': { bgcolor: open ? 'white.main' : undefined },
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
