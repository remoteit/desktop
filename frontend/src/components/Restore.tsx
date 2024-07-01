import React, { useState, useEffect } from 'react'
import { Dialog, DialogTitle, DialogContent } from '@mui/material'
import { useDispatch } from 'react-redux'
import { useParams } from 'react-router-dom'
import { Dispatch } from '../store'
import { Confirm } from '../components/Confirm'
import { Notice } from '../components/Notice'
import { emit } from '../services/Controller'

interface Props {
  deviceId: string
  restore: boolean
  onComplete: () => void
}

export const Restore: React.FC<Props> = ({ deviceId, restore, onComplete }) => {
  const { platform } = useParams<{ platform?: string }>()
  const [open, setOpen] = useState<boolean>(false)
  const dispatch = useDispatch<Dispatch>()

  const onRestore = async () => {
    setOpen(true)
    if (platform === 'pi') {
      const result = await dispatch.devices.getRestoreCommand(deviceId)
      if (result?.restoreCode) await dispatch.bluetooth.writeRegistrationCode(result.restoreCode)
      dispatch.ui.set({ redirect: '/onboard/raspberrypi/configuring' })
    }
  }

  useEffect(() => {
    if (restore) onRestore()
  }, [restore])

  return platform === 'pi' ? (
    <Dialog open={open} fullWidth>
      <Notice fullWidth>Restoring device...</Notice>
    </Dialog>
  ) : (
    <Confirm
      open={open}
      onConfirm={() => {
        dispatch.ui.set({ restoring: true, redirect: '/devices' })
        emit('restore', deviceId)
        setOpen(false)
      }}
      onDeny={() => {
        setOpen(false)
        onComplete()
      }}
      title="Restore device from Cloud"
    >
      We will attempt to restore this device's configuration. Please note this may not completely restore services that
      have custom host information.
    </Confirm>
  )
}
