import React, { useState } from 'react'
import { State, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Link, useHistory } from 'react-router-dom'
import { Menu, MenuItem, ListSubheader, ListItemIcon, ListItemText, Typography } from '@mui/material'
import { IconButton } from '../buttons/IconButton'
import { Confirm } from './Confirm'
import { Notice } from './Notice'
import { Icon } from './Icon'

export const DevicesActionMenu: React.FC = () => {
  const { t } = useTranslation()
  const selected = useSelector((state: State) => state.ui.selected)
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const [confirm, setConfirm] = useState<boolean>(false)

  const handleClose = () => setAnchorEl(null)
  const selectedLabel = t('devicesActionMenu.selectedCount', {
    count: selected.length,
    defaultValue_one: '{{count}} device selected',
    defaultValue_other: '{{count}} devices selected',
  })
  const deleteLabel = t('devicesActionMenu.deleteCount', {
    count: selected.length,
    defaultValue_one: 'Delete {{count}} device',
    defaultValue_other: 'Delete {{count}} devices',
  })

  return (
    <>
      <IconButton
        icon="ellipsis-v"
        title={t('devicesActionMenu.more', 'More')}
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
        <ListSubheader sx={{ backgroundColor: 'transparent' }}>{selectedLabel}</ListSubheader>
        <MenuItem dense to="/devices/transfer" component={Link} onClick={handleClose}>
          <ListItemIcon>
            <Icon name="arrow-turn-down-right" size="md" />
          </ListItemIcon>
          <ListItemText primary={t('devicesActionMenu.transfer', 'Transfer')} />
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
          <ListItemText primary={t('devicesActionMenu.delete', 'Delete')} />
        </MenuItem>
      </Menu>
      <Confirm
        open={confirm}
        title={t('devicesActionMenu.confirmTitle', 'Confirm Device Deletion')}
        action={deleteLabel}
        color="error"
        onConfirm={async () => {
          setConfirm(false)
          await dispatch.devices.destroySelected(selected)
          history.push('/devices')
        }}
        onDeny={() => setConfirm(false)}
      >
        <Notice severity="error" gutterBottom fullWidth>
          {t('devicesActionMenu.deleteWarning', 'Deletion is irreversible and may require device access for recovery.')}
        </Notice>
        <Typography variant="body2">
          {t('devicesActionMenu.uninstallHint', 'Uninstall the Remote.It agent before deletion for best results.')}
        </Typography>
      </Confirm>
    </>
  )
}
