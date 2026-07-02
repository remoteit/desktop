import React, { useState } from 'react'
import { State, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { Link, useHistory } from 'react-router-dom'
import { Menu, MenuItem, ListSubheader, ListItemIcon, ListItemText, Typography } from '@mui/material'
import { IconButton } from '../buttons/IconButton'
import { Confirm } from './Confirm'
import { Notice } from './Notice'
import { Icon } from './Icon'

export const DevicesActionMenu: React.FC = () => {
  const selected = useSelector((state: State) => state.ui.selected)
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const [confirm, setConfirm] = useState<boolean>(false)

  const handleClose = () => setAnchorEl(null)
  const count = `${selected.length} device${selected.length === 1 ? '' : 's'}`

  return (
    <>
      <IconButton
        icon="ellipsis-v"
        title="More"
        color="alwaysWhite"
        placement="bottom"
        disabled={!selected.length}
        onClick={e => setAnchorEl(e.currentTarget as HTMLButtonElement)}
      />
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
        <ListSubheader sx={{ backgroundColor: 'transparent' }}>{count} selected</ListSubheader>
        <MenuItem dense to="/devices/transfer" component={Link} onClick={handleClose}>
          <ListItemIcon>
            <Icon name="arrow-turn-down-right" size="md" />
          </ListItemIcon>
          <ListItemText primary="Transfer" />
        </MenuItem>
        <MenuItem
          dense
          onClick={() => {
            handleClose()
            setConfirm(true)
          }}
        >
          <ListItemIcon>
            <Icon name="trash" size="md" />
          </ListItemIcon>
          <ListItemText primary="Delete" />
        </MenuItem>
      </Menu>
      <Confirm
        open={confirm}
        title="Confirm Device Deletion"
        action={`Delete ${count}`}
        color="error"
        onConfirm={async () => {
          setConfirm(false)
          await dispatch.devices.destroySelected(selected)
          history.push('/devices')
        }}
        onDeny={() => setConfirm(false)}
      >
        <Notice severity="error" gutterBottom fullWidth>
          Deletion is irreversible and may require device access for recovery.
        </Notice>
        <Typography variant="body2">Uninstall the Remote.It agent before deletion for best results.</Typography>
      </Confirm>
    </>
  )
}
