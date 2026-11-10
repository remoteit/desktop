import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material'
import { Dispatch } from '../store'
import { graphQLAddDuplicateDevice } from '../services/deviceIdentity'
import { DeviceJoinKeyOnce, DownloadJoinKeyButton } from './DeviceJoinKeyOnce'
import { Notice } from './Notice'
import { Icon } from './Icon'

// Which machine the new device's key goes on: the copy (kept as a new device), or the original (the copy becomes X).
export type DuplicateTarget = 'copy' | 'original'

type Props = {
  device: Pick<IDevice, 'id' | 'name'>
  target: DuplicateTarget
  rotate: boolean // whether X's keys may be rotated after: offered once the key is shown
  onRotate: () => void // in place of this dialog
  onClose: () => void
}

const NAME_MAX = 255

/* One of the choices for a device whose join key is on two machines (graphql's addDuplicateDevice; docs/PROXY-GROUPS.md
   §11, "A duplicate of a device join key"): a new device with X's setup, and its key shown once, for the machine named
   — the copy, or the original. Until that key boots, whichever machine is online first is X. Done, it offers to rotate
   X's keys as well: a copied key may be in more places than the two machines. */
export const AddDuplicateDeviceDialog: React.FC<Props> = ({ device, target, rotate, onRotate, onClose }) => {
  const { t } = useTranslation()
  const dispatch = useDispatch<Dispatch>()
  const [name, setName] = useState(
    target === 'copy'
      ? t('addDuplicateDevice.copyName', { name: device.name, defaultValue: '{{name}} (copy)' })
      : t('addDuplicateDevice.originalName', { name: device.name, defaultValue: '{{name}} (original machine)' })
  )
  const [error, setError] = useState<string>()
  const [reason, setReason] = useState<string>()
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState<{ deviceId?: string; name: string; key: string }>()
  const [offer, setOffer] = useState(false)

  const add = async (event: React.FormEvent) => {
    event.preventDefault()
    if (adding) return
    const trimmed = name.trim()
    if (!trimmed) return setError(t('addDuplicateDevice.nameRequired', 'A name is required'))
    setReason(undefined)
    setAdding(true)
    const result = await graphQLAddDuplicateDevice(device.id, trimmed)
    setAdding(false)
    if (!result.key)
      return setReason(result.reason || t('addDuplicateDevice.notAdded', 'The new device could not be made.'))
    setAdded({ deviceId: result.deviceId, name: result.name || trimmed, key: result.key })
    // The new device into the list, and X read again: its flag now names the device made for the other machine.
    if (result.deviceId) dispatch.devices.fetchSingleFull({ id: result.deviceId, newDevice: true, silent: true })
    dispatch.devices.fetchSingleFull({ id: device.id, silent: true })
  }

  const done = () => (rotate ? setOffer(true) : onClose())

  if (offer)
    return (
      <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {t('addDuplicateDevice.rotateTitle', { name: device.name, defaultValue: 'Rotate the keys of {{name}} too?' })}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {t('addDuplicateDevice.rotateBody', {
              name: device.name,
              defaultValue:
                'A copied key may be in more places than the two machines — an image, a USB stick. Rotating revokes every key of {{name}} and issues a new one, shown once, for the machine that is to stay {{name}}.',
            })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t('addDuplicateDevice.notNow', 'Not now')}</Button>
          <Button variant="contained" color="error" onClick={onRotate}>
            {t('addDuplicateDevice.rotate', 'Rotate keys')}
          </Button>
        </DialogActions>
      </Dialog>
    )

  return (
    <Dialog open onClose={added || adding ? undefined : onClose} maxWidth="sm" fullWidth>
      {added ? (
        <>
          <DialogTitle>
            {t('addDuplicateDevice.addedTitle', { name: added.name, defaultValue: '{{name}} Added' })}
          </DialogTitle>
          <DialogContent>
            <DeviceJoinKeyOnce name={added.name} joinKey={added.key}>
              {target === 'copy'
                ? t('addDuplicateDevice.installOnCopy', {
                    name: device.name,
                    added: added.name,
                    defaultValue:
                      'Install this key on the copy — the other machine — and restart it: it then boots as {{added}}, and the original keeps the key of {{name}}.',
                  })
                : t('addDuplicateDevice.installOnOriginal', {
                    name: device.name,
                    added: added.name,
                    defaultValue:
                      'Install this key on the original machine and restart it: it then boots as {{added}}, and the copy, keeping the key of {{name}}, becomes {{name}}.',
                  })}{' '}
              {t('addDuplicateDevice.until', {
                name: device.name,
                defaultValue: 'Until then, whichever machine is online first is {{name}}, and the other stays refused.',
              })}
            </DeviceJoinKeyOnce>
          </DialogContent>
          <DialogActions>
            <DownloadJoinKeyButton name={added.name} joinKey={added.key} />
            <Button variant="contained" onClick={done}>
              {t('common.done', 'Done')}
            </Button>
          </DialogActions>
        </>
      ) : (
        <form onSubmit={add} noValidate>
          <DialogTitle>
            {target === 'copy'
              ? t('addDuplicateDevice.copyTitle', 'Keep the Copy as a New Device')
              : t('addDuplicateDevice.originalTitle', 'Make the Copy the Original')}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              {target === 'copy'
                ? t('addDuplicateDevice.copyDescription', {
                    name: device.name,
                    defaultValue:
                      'A new device is made with the setup of {{name}}, and its join key shown once. Install that key on the copy: it then boots as the new device, and the original stays {{name}}.',
                  })
                : t('addDuplicateDevice.originalDescription', {
                    name: device.name,
                    defaultValue:
                      'A new device is made with the setup of {{name}}, and its join key shown once. Install that key on the original machine: it boots as the new device from then on, and the copy, keeping the key of {{name}}, becomes {{name}}.',
                  })}
            </Typography>
            {reason && (
              <Notice severity="error" fullWidth gutterTop>
                {reason}
              </Notice>
            )}
            <TextField
              variant="filled"
              label={t('addDuplicateDevice.name', 'Name of the new device')}
              value={name}
              onChange={event => {
                setName(event.target.value)
                setError(undefined)
              }}
              error={!!error}
              helperText={error}
              inputProps={{ maxLength: NAME_MAX }}
              disabled={adding}
              autoFocus
              required
              fullWidth
              margin="normal"
            />
          </DialogContent>
          <DialogActions>
            <Button type="button" onClick={onClose} disabled={adding}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={adding}>
              {adding ? (
                <>
                  <Icon name="spinner-third" spin size="sm" inlineLeft />
                  {t('addDuplicateDevice.adding', 'Making...')}
                </>
              ) : (
                t('addDuplicateDevice.add', 'Make Device and Key')
              )}
            </Button>
          </DialogActions>
        </form>
      )}
    </Dialog>
  )
}
