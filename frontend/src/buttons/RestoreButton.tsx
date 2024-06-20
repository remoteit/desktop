import React, { useState } from 'react'
import { emit } from '../services/Controller'
import { useParams } from 'react-router-dom'
import { attributeName } from '@common/nameHelper'
import { Button, Box } from '@mui/material'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../store'
import { Confirm } from '../components/Confirm'

export const RestoreButton: React.FC<{ device: IDevice }> = ({ device }) => {
  const { platform } = useParams<{ platform?: string }>()
  const [open, setOpen] = useState<boolean>(false)
  const dispatch = useDispatch<Dispatch>()

  const onRestore = async () => {
    if (platform === 'pi') {
      const result = await dispatch.devices.getRestoreCommand(device.id)
      if (result?.restoreCode) await dispatch.bluetooth.writeRegistrationCode(result.restoreCode)
      dispatch.ui.set({ redirect: '/onboard/raspberrypi/configuring' })
    } else setOpen(true)
  }

  return (
    <Box>
      <Button onClick={onRestore} color="primary" variant="contained" size="small">
        RESTORE
      </Button>
      <Confirm
        open={open}
        onConfirm={() => {
          dispatch.ui.set({ restoring: true, redirect: '/devices' })
          emit('restore', device.id)
          setOpen(false)
        }}
        onDeny={() => setOpen(false)}
        title="Restore device from Cloud"
      >
        We will attempt to restore this device's configuration. Please note this may not completely restore services
        that have custom host information.
      </Confirm>
    </Box>
  )
}
