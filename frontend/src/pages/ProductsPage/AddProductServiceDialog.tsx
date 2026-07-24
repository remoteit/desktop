import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
} from '@mui/material'
import { Icon } from '../../components/Icon'
import { Notice } from '../../components/Notice'
import { dispatch, State } from '../../store'
import { IProductService } from '../../models/products'

interface Props {
  open: boolean
  productId: string
  onClose: () => void
  onServiceAdded: (service: IProductService) => void
}

export const AddProductServiceDialog: React.FC<Props> = ({
  open,
  productId,
  onClose,
  onServiceAdded,
}) => {
  const { t } = useTranslation()
  const applicationTypes = useSelector((state: State) => state.applicationTypes.all)
  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [port, setPort] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTypeChange = (selectedType: string) => {
    setType(selectedType)
    // Set default port for the selected application type
    const appType = applicationTypes.find(t => String(t.id) === selectedType)
    if (appType?.port) {
      setPort(String(appType.port))
    }
  }

  const resetForm = () => {
    setName('')
    setType('')
    setPort('')
    setEnabled(true)
    setError(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleCreate = async () => {
    if (!name.trim()) {
      setError(t('addProductServiceDialog.nameRequired', 'Service name is required'))
      return
    }
    if (!type) {
      setError(t('addProductServiceDialog.typeRequired', 'Service type is required'))
      return
    }
    const portNum = parseInt(port)
    if (isNaN(portNum) || portNum < 0 || portNum > 65535) {
      setError(t('addProductServiceDialog.portRange', 'Port must be a number between 0 and 65535'))
      return
    }

    setError(null)
    setCreating(true)

    const service = await dispatch.products.addService({
      productId,
      input: {
        name: name.trim(),
        type,
        port: portNum,
        enabled,
      },
    })

    if (service) {
      onServiceAdded(service)
      handleClose()
    } else {
      setError(t('addProductServiceDialog.addFailed', 'Failed to add service'))
    }
    setCreating(false)
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('addProductServiceDialog.title', 'Add Service')}</DialogTitle>
      <DialogContent>
        {error && (
          <Notice severity="error" fullWidth gutterBottom>
            {error}
          </Notice>
        )}

        <TextField
          label={t('addProductServiceDialog.serviceName', 'Service Name')}
          value={name}
          onChange={e => setName(e.target.value)}
          fullWidth
          required
          autoFocus
          margin="normal"
          disabled={creating}
        />

        <FormControl fullWidth margin="normal" required>
          <InputLabel>{t('addProductServiceDialog.serviceType', 'Service Type')}</InputLabel>
          <Select
            value={type}
            onChange={e => handleTypeChange(e.target.value)}
            label={t('addProductServiceDialog.serviceType', 'Service Type')}
            disabled={creating}
          >
            {applicationTypes.map(at => (
              <MenuItem key={at.id} value={String(at.id)}>
                {at.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label={t('addProductServiceDialog.port', 'Port')}
          value={port}
          onChange={e => setPort(e.target.value)}
          fullWidth
          required
          type="number"
          margin="normal"
          disabled={creating}
          inputProps={{ min: 0, max: 65535 }}
        />

        <FormControlLabel
          control={
            <Switch
              checked={enabled}
              onChange={e => setEnabled(e.target.checked)}
              disabled={creating}
            />
          }
          label={t('addProductServiceDialog.enabled', 'Enabled')}
          sx={{ marginTop: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={creating}>
          {t('common.cancel', 'Cancel')}
        </Button>
        <Button variant="contained" color="primary" onClick={handleCreate} disabled={creating}>
          {creating ? (
            <>
              <Icon name="spinner-third" spin size="sm" inline />
              {t('addProductServiceDialog.addingEllipsis', 'Adding...')}
            </>
          ) : (
            t('addProductServiceDialog.title', 'Add Service')
          )}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

