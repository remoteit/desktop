import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material'
import { Dispatch, State } from '../store'
import { getProductModel } from '../models/products'
import { graphQLAddDevice } from '../services/deviceIdentity'
import { DeviceJoinKeyOnce, DownloadJoinKeyButton } from './DeviceJoinKeyOnce'
import { Notice } from './Notice'
import { Icon } from './Icon'

type Props = { onClose: () => void }

const NAME_MAX = 255
const NO_PRODUCT = ''

type Added = { deviceId?: string; name: string; key?: string }

/* A device added ahead of its first boot (graphql's addDevice; docs/PROXY-GROUPS.md §11, "Externally held identity"):
   its name and product, made as the product's credential would register it — never online, a Control Link device
   from the start, taking no licence until it first comes online. "This device starts fresh every boot" gives it its
   first device join key, shown once; the key lives in this dialog's state alone, and only Done closes it. */
export const AddDeviceAheadDialog: React.FC<Props> = ({ onClose }) => {
  const { t } = useTranslation()
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()
  const products = useSelector((state: State) => getProductModel(state).all)
  const [name, setName] = useState('')
  const [productId, setProductId] = useState(NO_PRODUCT)
  const [freshBoot, setFreshBoot] = useState(true)
  const [error, setError] = useState<string>()
  const [reason, setReason] = useState<string>()
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState<Added>()

  useEffect(() => {
    dispatch.products.fetchIfEmpty()
  }, [])

  const add = async (event: React.FormEvent) => {
    event.preventDefault()
    if (adding) return
    const trimmed = name.trim()
    if (!trimmed) return setError(t('addDeviceAhead.nameRequired', 'A name is required'))
    setReason(undefined)
    setAdding(true)
    const result = await graphQLAddDevice({ name: trimmed, productId: productId || undefined, freshBoot })
    setAdding(false)
    if (result.reason !== undefined || (!result.deviceId && !result.key))
      return setReason(result.reason || t('addDeviceAhead.notAdded', 'The device could not be added.'))
    setAdded({ deviceId: result.deviceId, name: result.name || trimmed, key: result.key })
    if (result.deviceId) dispatch.devices.fetchSingleFull({ id: result.deviceId, newDevice: true, silent: true })
  }

  const open = () => {
    onClose()
    if (added?.deviceId) history.push(`/devices/${added.deviceId}`)
  }

  return (
    <Dialog open onClose={added || adding ? undefined : onClose} maxWidth="sm" fullWidth>
      {added ? (
        <>
          <DialogTitle>
            {t('addDeviceAhead.addedTitle', { name: added.name, defaultValue: 'Added {{name}}' })}
          </DialogTitle>
          <DialogContent>
            {added.key ? (
              <DeviceJoinKeyOnce name={added.name} joinKey={added.key}>
                {t(
                  'addDeviceAhead.installKey',
                  'Put this key where the machine gets it at boot. Its first boot with it brings the device online.'
                )}
              </DeviceJoinKeyOnce>
            ) : (
              <Typography variant="body2" gutterBottom>
                {freshBoot
                  ? t(
                      'addDeviceAhead.noKey',
                      'The device was added, but its key did not come back. Issue one from its settings.'
                    )
                  : t(
                      'addDeviceAhead.added',
                      'It has its ID and its product’s setup, and takes no licence until it first comes online.'
                    )}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            {added.key && <DownloadJoinKeyButton name={added.name} joinKey={added.key} />}
            {added.deviceId && <Button onClick={open}>{t('addDeviceAhead.open', 'Open device')}</Button>}
            <Button variant="contained" onClick={onClose}>
              {t('common.done', 'Done')}
            </Button>
          </DialogActions>
        </>
      ) : (
        <form onSubmit={add} noValidate>
          <DialogTitle>{t('addDeviceAhead.title', 'Add a Device Ahead')}</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              {t(
                'addDeviceAhead.description',
                'Make the device before its machine first boots: its ID, and its product’s services and tags. It takes no licence until it first comes online.'
              )}
            </Typography>
            {reason && (
              <Notice severity="error" fullWidth gutterTop>
                {reason}
              </Notice>
            )}
            <TextField
              variant="filled"
              label={t('addDeviceAhead.name', 'Name')}
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
            <TextField
              select
              variant="filled"
              label={t('addDeviceAhead.product', 'Product')}
              value={productId}
              onChange={event => setProductId(event.target.value)}
              helperText={t('addDeviceAhead.productHelp', 'Optional: the device starts from its services and tags')}
              disabled={adding}
              fullWidth
              margin="normal"
            >
              <MenuItem value={NO_PRODUCT}>{t('addDeviceAhead.noProduct', 'No product')}</MenuItem>
              {products.map(product => (
                <MenuItem key={product.id} value={product.id}>
                  {product.name}
                </MenuItem>
              ))}
            </TextField>
            <FormControlLabel
              control={
                <Checkbox
                  checked={freshBoot}
                  onChange={event => setFreshBoot(event.target.checked)}
                  disabled={adding}
                />
              }
              label={t('addDeviceAhead.freshBoot', 'This device starts fresh every boot')}
            />
            <Typography variant="caption" color="textSecondary" component="p" sx={{ marginLeft: 4 }}>
              {t(
                'addDeviceAhead.freshBootHelp',
                'It has nowhere to keep its identity: a device join key, shown once now, brings it back as itself at every boot.'
              )}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button type="button" onClick={onClose} disabled={adding}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={adding}>
              {adding ? (
                <>
                  <Icon name="spinner-third" spin size="sm" inlineLeft />
                  {t('addDeviceAhead.adding', 'Adding...')}
                </>
              ) : (
                t('addDeviceAhead.add', 'Add')
              )}
            </Button>
          </DialogActions>
        </form>
      )}
    </Dialog>
  )
}
