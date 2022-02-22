import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { makeStyles, Tooltip, IconButton } from '@material-ui/core'
import { ApplicationState, Dispatch } from '../store'
import { Icon } from '../components/Icon'

export const ColumnsButton: React.FC = () => {
  const open = useSelector((state: ApplicationState) => state.ui.drawerMenu === 'COLUMNS')
  const { ui } = useDispatch<Dispatch>()
  const css = useStyles({ open })

  return (
    <Tooltip title="Columns" className={css.button}>
      <IconButton onClick={() => ui.setPersistent({ drawerMenu: open ? null : 'COLUMNS' })}>
        <Icon name={open ? 'times' : 'line-columns'} size="base" fixedWidth />
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
