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
  const css = useStyles({ open })
  const icon = open ? 'times' : 'filter'
  return (
    <Tooltip title={open ? 'Hide Filters' : 'Show Filters'} className={css.button} arrow>
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

const useStyles = makeStyles(({ palette }) => ({
  button: ({ open }: { open: boolean }) => ({
    borderTop: `1px solid ${open ? palette.grayLighter.main : palette.white.main}`,
    borderRight: `1px solid ${open ? palette.grayLighter.main : palette.white.main}`,
    borderLeft: `1px solid ${open ? palette.grayLighter.main : palette.white.main}`,
    paddingBottom: 16,
    marginTop: 4,
    background: open ? palette.white.main : undefined,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  }),
}))
