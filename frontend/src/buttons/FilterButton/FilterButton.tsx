import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { makeStyles, Tooltip, IconButton, Badge } from '@material-ui/core'
import { selectIsFiltered } from '../../models/devices'
import { ApplicationState, Dispatch } from '../../store'
import { Icon } from '../../components/Icon'

export const FilterButton: React.FC = () => {
  const { open, changed } = useSelector((state: ApplicationState) => ({
    open: state.ui.drawerMenu === 'FILTER',
    changed: selectIsFiltered(state),
  }))
  const { ui } = useDispatch<Dispatch>()
  const css = useStyles({ open })
  const icon = open ? 'times' : 'filter'
  return (
    <Tooltip title={open ? 'Hide filters' : 'Show filters'} className={css.button}>
      <IconButton onMouseDown={() => ui.setPersistent({ drawerMenu: open ? null : 'FILTER' })}>
        {changed ? (
          <Badge variant="dot" color="primary">
            <Icon name={icon} size="base" type="regular" fixedWidth />
          </Badge>
        ) : (
          <Icon name={icon} size="base" type="regular" fixedWidth />
        )}
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
