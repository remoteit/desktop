import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { makeStyles, Tooltip, IconButton, Badge } from '@material-ui/core'
import { ApplicationState, Dispatch } from '../store'
import { defaultState } from '../models/ui'
import { Icon } from '../components/Icon'

export const ColumnsButton: React.FC = () => {
  const { open, changed } = useSelector((state: ApplicationState) => ({
    open: state.ui.drawerMenu === 'COLUMNS',
    changed: state.ui.columns.length > defaultState.columns.length,
  }))
  const { ui } = useDispatch<Dispatch>()
  const css = useStyles({ open })
  const icon = open ? 'times' : 'line-columns'
  return (
    <Tooltip title="Columns" className={css.button}>
      <IconButton onClick={() => ui.setPersistent({ drawerMenu: open ? null : 'COLUMNS' })}>
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
