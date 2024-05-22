import React from 'react'
import { makeStyles } from '@mui/styles'
import { useSelector, useDispatch } from 'react-redux'
import { State, Dispatch } from '../store'
import { ListSubheader, List, ListItemText, ListItemButton, ListItemIcon, Button } from '@mui/material'
import { selectAllActiveAttributes } from '../selectors/devices'
import { defaultState } from '../models/ui'
import { spacing } from '../styling'
import { Drawer } from './Drawer'
import { Icon } from './Icon'

export const ColumnsDrawer: React.FC = () => {
  const attributes = useSelector(selectAllActiveAttributes).filter(a => a.column)
  const selected = useSelector((state: State) => state.ui.columns)
  const { ui, devices } = useDispatch<Dispatch>()
  const css = useStyles()

  const add = name => {
    ui.setPersistent({ columns: [...selected, name] })
    devices.fetchList()
  }
  const remove = index => {
    const columns = [...selected]
    columns.splice(index, 1)
    ui.setPersistent({ columns })
  }

  const onReset = () => {
    ui.setPersistent({
      columns: [...defaultState.columns],
      columnWidths: { ...defaultState.columnWidths },
      drawerMenu: null,
    })
    devices.fetchList()
  }

  return (
    <Drawer menu="COLUMNS">
      <List dense className={css.list}>
        <ListSubheader>
          Columns
          <Button size="small" color="primary" onClick={onReset}>
            Reset
          </Button>
        </ListSubheader>
        {attributes.map(data => {
          const checked = selected.indexOf(data.id)
          return (
            <ListItemButton
              dense
              key={data.id}
              disabled={data.required}
              sx={{ paddingY: 0 }}
              onClick={() => (checked >= 0 ? remove(checked) : add(data.id))}
            >
              <ListItemIcon>{checked >= 0 && <Icon name="check" color="primary" />}</ListItemIcon>
              <ListItemText
                primary={data.label}
                primaryTypographyProps={{ color: checked >= 0 ? 'primary' : undefined }}
              />
            </ListItemButton>
          )
        })}
      </List>
    </Drawer>
  )
}

const useStyles = makeStyles({
  list: {
    padding: 0,
    marginBottom: spacing.lg,
    textTransform: 'capitalize',
    '& .MuiListSubheader-root': { display: 'flex', justifyContent: 'space-between', paddingRight: 0 },
  },
})
