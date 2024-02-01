import React from 'react'
import isEqual from 'lodash.isequal'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { Tooltip, IconButton } from '@mui/material'
import { defaultState } from '../models/ui'
import { Icon } from '../components/Icon'

export const ColumnsButton: React.FC = () => {
  const { open, modified } = useSelector((state: ApplicationState) => ({
    open: state.ui.drawerMenu === 'COLUMNS',
    modified: !isEqual(state.ui.columns, defaultState.columns),
  }))
  const { ui } = useDispatch<Dispatch>()
  const icon = open ? 'times' : 'line-columns'
  return (
    <Tooltip
      placement="left"
      title={open ? 'Hide Columns' : 'Show Columns'}
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
          ui.set({ drawerMenu: open ? null : 'COLUMNS' })
        }}
        size="large"
      >
        <Icon name={icon} size="base" type="regular" modified={modified} fixedWidth />
      </IconButton>
    </Tooltip>
  )
}
