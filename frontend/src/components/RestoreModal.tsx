import React, { useState, useEffect } from 'react'
import { Button, Dialog, DialogProps, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material'
import { State, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { CopyRegistrationCode } from './CopyRegistrationCode'
type Props = Omit<DialogProps, 'open'> & {
  device: IDevice
}

export const RestoreModal: React.FC<Props> = ({ device, ...props }) => {
  const { showRestoreModal } = useSelector((state: State) => state.ui)
  const [loading, setLoading] = useState<boolean>(false)
  const [result, setResult] = useState<{ restoreCommand?: string; restoreCode?: string }>({})
  const dispatch = useDispatch<Dispatch>()

  useEffect(() => {
    if (!showRestoreModal || loading) return
    ;(async () => {
      setLoading(true)
      const result = await dispatch.devices.getRestoreCommand(device.id)
      setResult(result)
      setLoading(false)
    })()

    return function cleanup() {
      setResult({})
      setLoading(false)
    }
  }, [device, showRestoreModal])

  function onClose() {
    dispatch.ui.set({ showRestoreModal: false })
  }

  return (
    <Dialog open={showRestoreModal} onClose={onClose} maxWidth="lg">
      <DialogTitle>Restore "{device.name}"</DialogTitle>
      <DialogContent sx={{ maxWidth: 620 }}>
        <Typography variant="body1" gutterBottom>
          If you lost or deleted this device you can restore it by running the <br />
          following command on the device.
        </Typography>
        <CopyRegistrationCode
          code={result.restoreCode}
          value={result.restoreCommand ? result.restoreCommand : 'generating command...'}
          label="Restore Code"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary" type="button" variant="contained">
          Done
        </Button>
      </DialogActions>
    </Dialog>
  )
}
