import React, { useState, useEffect } from 'react'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { makeStyles, ListSubheader, List, ListItemText, ListItem, ListItemIcon } from '@material-ui/core'
import { deviceDetails } from '../hooks/useDeviceDetails'
import { spacing, colors } from '../styling'
import { Drawer } from './Drawer'
import { Icon } from './Icon'

export const ColumnsDrawer: React.FC = () => {
  const { open, selected } = useSelector((state: ApplicationState) => ({
    open: state.ui.drawerMenu === 'COLUMNS',
    selected: state.ui.columns,
  }))
  const { ui, devices } = useDispatch<Dispatch>()
  const css = useStyles()

  const add = name => ui.set({ columns: [...selected, name] })
  const remove = index => {
    selected.splice(index, 1)
    ui.set({ columns: selected })
  }

  return (
    <Drawer open={open}>
      <List dense className={css.list}>
        <ListSubheader>Columns</ListSubheader>
        {deviceDetails.map(data => {
          const checked = selected.indexOf(data.name)
          return (
            <ListItem button dense key={data.name} onClick={() => (checked >= 0 ? remove(checked) : add(data.name))}>
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
    textTransform: 'capitalize',
    '& .MuiListItem-dense': { paddingTop: 0, paddingBottom: 0, paddingLeft: 0 },
  },
})
