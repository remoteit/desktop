import React, { useState } from 'react'
import { useHistory } from 'react-router-dom'
import { emit } from '../services/Controller'
import { Button } from '@material-ui/core'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'
import { Confirm } from '../components/Confirm'

export const RestoreButton: React.FC<{ device: IDevice; onClick?: () => void }> = ({ device, onClick }) => {
  const [open, setOpen] = useState<boolean>(false)
  const history = useHistory()
  const { ui } = useDispatch<Dispatch>()

  return (
    <>
      <Button onClick={() => setOpen(true)} color="primary" variant="contained" size="small">
        Restore
      </Button>
      <Confirm
        open={open}
        onConfirm={() => {
          ui.set({ restoring: true })
          emit('restore', device.id)
          history.push('/devices')
        }}
        onDeny={() => setOpen(false)}
        title="Restore device from Cloud"
      >
        We will attempt to restore this device's configuration. Please note this may not completely restore services
        that have custom host information.
      </Confirm>
    </>
  )
}
