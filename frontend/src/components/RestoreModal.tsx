import React, { useState, useEffect } from 'react'
import { Button, Dialog, DialogProps, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material'
import { State, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { CopyRegistrationCode } from './CopyRegistrationCode'
type Props = Omit<DialogProps, 'open'> & {
  device: IDevice
}

export const RestoreModal: React.FC<Props> = ({ device }) => {
  const { showRestoreModal } = useSelector((state: State) => state.ui)
  const [result, setResult] = useState<{ restoreCommand?: string; restoreCode?: string }>({})
  const dispatch = useDispatch<Dispatch>()
  const { t } = useTranslation()

  // One read for each opening, keyed on the device's id and not its object, which changes with every device update: a
  // Control Link device's restore code is minted fresh by each request and the one before cancelled, so a read again
  // while open would cancel the code just copied. The one query asks restoreCode and restoreCommand together, so both
  // carry the same code. A read that answers after the modal closed is dropped.
  useEffect(() => {
    if (!showRestoreModal) return
    let open = true
    dispatch.devices.getRestoreCommand(device.id).then(fetched => {
      if (open) setResult(fetched)
    })
    return () => {
      open = false
      setResult({})
    }
  }, [device.id, showRestoreModal])

  function onClose() {
    dispatch.ui.set({ showRestoreModal: false })
  }

  return (
    <Dialog open={showRestoreModal} onClose={onClose} maxWidth="lg">
      <DialogTitle>{t('restoreModal.title', { name: device.name, defaultValue: 'Restore "{{name}}"' })}</DialogTitle>
      <DialogContent sx={{ maxWidth: 620 }}>
        <Typography variant="body1" gutterBottom>
          {t(
            'restoreModal.instructions',
            'If you lost or deleted this device you can restore it by running the following command on the device.'
          )}
        </Typography>
        <CopyRegistrationCode
          code={result.restoreCode}
          value={result.restoreCommand ? result.restoreCommand : t('restoreModal.generatingCommand', 'generating command...')}
          label={t('restoreModal.restoreCodeLabel', 'Restore Code')}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary" type="button" variant="contained">
          {t('common.done', 'Done')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
