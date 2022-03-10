import React from 'react'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { makeStyles, ListSubheader, List, ListItemText, ListItem, ListItemIcon, Button } from '@material-ui/core'
import { masterAttributes, deviceAttributes } from './Attributes'
import { defaultState } from '../models/ui'
import { spacing } from '../styling'
import { Drawer } from './Drawer'
import { Icon } from './Icon'

export const ColumnsDrawer: React.FC = () => {
  const { open, columnWidths, selected, feature } = useSelector((state: ApplicationState) => ({
    open: state.ui.drawerMenu === 'COLUMNS',
    columnWidths: state.ui.columnWidths,
    selected: state.ui.columns,
    feature: state.ui.feature,
  }))
  const { ui } = useDispatch<Dispatch>()
  const css = useStyles()

  const add = name => ui.setPersistent({ columns: [...selected, name] })
  const remove = index => {
    selected.splice(index, 1)
    ui.setPersistent({ columns: [...selected] })
  }

  const attributes = masterAttributes.concat(deviceAttributes).filter(a => a.column && a.show(feature))

  const onReset = () => {
    const deviceName = attributes.find(a => a.id === 'deviceName')?.defaultWidth
    const services = attributes.find(a => a.id === 'services')?.defaultWidth
    ui.setPersistent({ columns: [...defaultState.columns], columnWidths: { ...columnWidths, deviceName, services } })
    ui.set({ drawerMenu: null })
  }

  return (
    <Drawer open={open}>
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
