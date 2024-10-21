import React, { useState } from 'react'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { Menu, MenuItem, ListSubheader, ListItemIcon, ListItemText } from '@mui/material'
import { IconButton } from '../buttons/IconButton'
import { Icon } from './Icon'

type Props = { device?: IDevice }

export const DeviceScriptingMenu: React.FC<Props> = ({ device }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const handleClick = event => setAnchorEl(event.currentTarget)
  const handleClose = () => setAnchorEl(null)
  const dispatch = useDispatch<Dispatch>()

  if (!device?.permissions.includes('SCRIPTING')) return null

  return (
    <>
      <IconButton onClick={handleClick} name="scripting" color="grayDarker" size="md" type="light" fixedWidth />
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        disableScrollLock
        autoFocus={false}
        elevation={2}
      >
        <ListSubheader disableGutters sx={{ bgcolor: 'transparent' }}>
          Run script
        </ListSubheader>
        <MenuItem
          dense
          to="/scripting/scripts"
          onClick={() => dispatch.ui.set({ selected: [device.id] })}
          component={Link}
        >
          <ListItemIcon>
            <Icon name="chevron-right" size="md" />
          </ListItemIcon>
          <ListItemText primary="Choose Script" />
        </MenuItem>
        <MenuItem dense to="/scripting/add" onClick={() => dispatch.ui.set({ selected: [device.id] })} component={Link}>
          <ListItemIcon>
            <Icon name="plus" size="md" />
          </ListItemIcon>
          <ListItemText primary="New Script" />
        </MenuItem>
      </Menu>
    </>
  )
}
