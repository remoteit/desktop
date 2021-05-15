import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Tooltip, IconButton, Badge } from '@material-ui/core'
import { ApplicationState, Dispatch } from '../store'
import { Icon } from '../components/Icon'

export const ColumnsButton: React.FC = () => {
  const open = useSelector((state: ApplicationState) => state.ui.drawerMenu === 'COLUMNS')
  const { ui } = useDispatch<Dispatch>()

  return (
    <Tooltip title="Columns">
      <IconButton onClick={() => ui.set({ drawerMenu: open ? null : 'COLUMNS' })}>
        <Icon name="line-columns" size="base" fixedWidth />
      </IconButton>
    </Tooltip>
  )
}
