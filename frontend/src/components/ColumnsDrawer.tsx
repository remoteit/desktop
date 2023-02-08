import React from 'react'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { makeStyles } from '@mui/styles'
import { ListSubheader, List, ListItemText, ListItem, ListItemIcon, Button } from '@mui/material'
import { getColumns } from './Attributes'
import { selectLimitsLookup } from '../selectors/organizations'
import { defaultState } from '../models/ui'
import { spacing } from '../styling'
import { Drawer } from './Drawer'
import { Icon } from './Icon'

export const ColumnsDrawer: React.FC = () => {
  const { selected, feature } = useSelector((state: ApplicationState) => ({
    selected: [...state.ui.columns],
    feature: selectLimitsLookup(state),
  }))
  const { ui, devices } = useDispatch<Dispatch>()
  const css = useStyles()

  const add = name => {
    ui.setPersistent({ columns: [...selected, name] })
    devices.fetchList()
  }
  const remove = index => {
    selected.splice(index, 1)
    ui.setPersistent({ columns: [...selected] })
  }

  const attributes = getColumns(feature)

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
            <ListItem
              dense
              button
              disableGutters
              disabled={data.required}
              key={data.id}
              onClick={() => (checked >= 0 ? remove(checked) : add(data.id))}
            >
              <ListItemIcon>{checked >= 0 && <Icon name="check" color="primary" />}</ListItemIcon>
              <ListItemText
                primary={data.label}
                primaryTypographyProps={{ color: checked >= 0 ? 'primary' : undefined }}
              />
            </ListItem>
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
    '& .MuiListItem-dense': { paddingTop: 0, paddingBottom: 0, paddingLeft: 0 },
    '& .MuiListSubheader-root': { display: 'flex', justifyContent: 'space-between', paddingRight: 0 },
  },
})
