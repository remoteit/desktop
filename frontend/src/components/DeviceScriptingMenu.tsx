import React, { useState } from 'react'
import { State, Dispatch } from '../store'
import { useDispatch, useSelector } from 'react-redux'
import { selectActiveAccountId } from '../selectors/accounts'
import { selectVisibleDevices } from '../selectors/devices'
import { Chip, Menu, MenuItem, ListSubheader, ListItemIcon, ListItemText } from '@mui/material'
import { Link } from 'react-router-dom'
import { Icon } from './Icon'

type Props = { device?: IDevice }

export const DeviceScriptingMenu: React.FC<Props> = ({ device }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const handleClick = event => setAnchorEl(event.currentTarget)
  const handleClose = () => setAnchorEl(null)
  const dispatch = useDispatch<Dispatch>()
  const inActiveAccount = useSelector(
    (state: State) =>
      device?.owner.id === selectActiveAccountId(state) || selectVisibleDevices(state).some(d => d.id === device?.id)
  )

  if (!device?.permissions.includes('SCRIPTING')) return null
  // Choose Script lists the active account's scripts, but DevicePage can show another account's device. Neither
  // device.accountId (fetch-by-id stamps the active one) nor device.access (only managers see shares) can tell.
  if (!inActiveAccount) return null

  return (
    <>
      <Chip
        label={
          <>
            <Icon name="chevron-right" size="sm" inlineLeft />
            SCRIPT
          </>
        }
        sx={{ fontWeight: 500, letterSpacing: 1, color: 'grayDarker.main' }}
        size="small"
        onClick={handleClick}
      />
      {/* <IconButton onClick={handleClick} name="scripting" color="grayDarker" size="md" type="light" fixedWidth /> */}
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
        <MenuItem dense to="/scripts" onClick={() => dispatch.ui.set({ selected: [device.id] })} component={Link}>
          <ListItemIcon>
            <Icon name="chevron-right" size="md" />
          </ListItemIcon>
          <ListItemText primary="Choose Script" />
        </MenuItem>
        <MenuItem dense to="/scripts/add" onClick={() => dispatch.ui.set({ selected: [device.id] })} component={Link}>
          <ListItemIcon>
            <Icon name="plus" size="md" />
          </ListItemIcon>
          <ListItemText primary="New Script" />
        </MenuItem>
      </Menu>
    </>
  )
}
