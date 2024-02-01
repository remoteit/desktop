import React from 'react'
import { makeStyles } from '@mui/styles'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { Tooltip, IconButton } from '@mui/material'
import { selectIsFiltered } from '../../models/devices'
import { Icon } from '../../components/Icon'

export const FilterButton: React.FC = () => {
  const { open, modified } = useSelector((state: ApplicationState) => ({
    open: state.ui.drawerMenu === 'FILTER',
    modified: selectIsFiltered(state),
  }))
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