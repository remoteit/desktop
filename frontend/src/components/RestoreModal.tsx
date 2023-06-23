import React, { useState, useEffect } from 'react'
import { Button, Dialog, DialogProps, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { attributeName } from '../shared/nameHelper'
import { CopyCodeBlock } from './CopyCodeBlock'

type Props = Omit<DialogProps, 'open'> & {
  device: IDevice
}

export const RestoreModal: React.FC<Props> = ({ device, ...props }) => {
  const { showRestoreModal } = useSelector((state: ApplicationState) => state.ui)
  const [loading, setLoading] = useState<boolean>(false)
  const [result, setResult] = useState<{ restoreCommand?: string; restoreCode?: string }>({})
  const dispatch = useDispatch<Dispatch>()

  useEffect(() => {
    console.log('SHOW RESTORE MODAL', showRestoreModal, device?.id)
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
      <DialogTitle>Restore “{attributeName(device)}”</DialogTitle>
      <DialogContent sx={{ width: 620 }}>
        <Typography variant="body1" gutterBottom>
          If you lost or deleted this device you can restore it by running the <br />
          following command on the device.
        </Typography>
        <CopyCodeBlock
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
