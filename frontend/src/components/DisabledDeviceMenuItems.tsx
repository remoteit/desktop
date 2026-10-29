import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { MenuItem, ListItemIcon, ListItemText } from '@mui/material'
import { Dispatch, State } from '../store'
import { useCanDecommission } from '../hooks/useDeviceDisable'
import { DecommissionDialog } from './DecommissionDialog'
import { Icon } from './Icon'

type Props = { device: IDevice; onClick?: () => void }

// A disabled device's menu: Restore (MANAGE, as graphql asks) ...
export const RestoreDisabledMenuItem: React.FC<Props> = ({ device, onClick }) => {
  const { t } = useTranslation()
  const dispatch = useDispatch<Dispatch>()
  const destroying = useSelector((state: State) => state.ui.destroying)
  if (!device.disabled || !device.permissions.includes('MANAGE')) return null
  return (
    <MenuItem
      dense
      disabled={destroying}
      onClick={() => {
        onClick?.()
        dispatch.devices.restore([device.id])
      }}
    >
      <ListItemIcon>
        <Icon name="rotate-left" size="md" fixedWidth />
      </ListItemIcon>
      <ListItemText primary={t('disabledDevice.restoreDevice', 'Restore device')} />
    </MenuItem>
  )
}

// ... and Decommission…, for its owner or an org admin.
export const DecommissionMenuItem: React.FC<Props> = ({ device, onClick }) => {
  const { t } = useTranslation()
  const history = useHistory()
  const canDecommission = useCanDecommission(device)
  const [open, setOpen] = useState(false)
  if (!canDecommission) return null
  return (
    <>
      <MenuItem dense onClick={() => setOpen(true)}>
        <ListItemIcon>
          <Icon name="trash" size="md" fixedWidth />
        </ListItemIcon>
        <ListItemText primary={t('disabledDevice.decommission', 'Decommission…')} />
      </MenuItem>
      <DecommissionDialog
        open={open}
        devices={[device]}
        onClose={() => {
          setOpen(false)
          onClick?.()
        }}
        onDone={() => history.push('/devices/disabled')}
      />
    </>
  )
}
