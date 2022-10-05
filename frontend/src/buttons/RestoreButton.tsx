import React, { useState } from 'react'
import { emit } from '../services/Controller'
import { Button, Box } from '@mui/material'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'
import { Confirm } from '../components/Confirm'

export const RestoreButton: React.FC<{ device: IDevice; onClick?: () => void }> = ({ device, onClick }) => {
  const [open, setOpen] = useState<boolean>(false)
  const { ui } = useDispatch<Dispatch>()

  return (
    <Box>
      <Button onClick={() => setOpen(true)} color="primary" variant="contained" size="small">
        RESTORE
      </Button>
      <Confirm
        open={open}
        onConfirm={() => {
          ui.set({ restoring: true })
          emit('restore', device.id)
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
