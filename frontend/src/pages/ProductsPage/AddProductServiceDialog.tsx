import React, { useState } from 'react'
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
import { graphQLAddDeviceProductService } from '../../services/graphQLDeviceProducts'
import { graphQLGetErrors } from '../../services/graphQL'

// Common service types
const SERVICE_TYPES = [
  { value: '1', label: 'TCP (1)' },
  { value: '4', label: 'SSH (4)' },
  { value: '5', label: 'Web/HTTP (5)' },
  { value: '7', label: 'VNC (7)' },
  { value: '8', label: 'HTTPS (8)' },
  { value: '28', label: 'RDP (28)' },
  { value: '33', label: 'Samba (33)' },
  { value: '34', label: 'Bulk Service (34)' },
  { value: '35', label: 'Bulk Identification (35)' },
]

interface IProductService {
  id: string
  name: string
  type: string
  port: number
  enabled: boolean
  platformCode: string
}

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
  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [port, setPort] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      setError('Service name is required')
      return
    }
    if (!type) {
      setError('Service type is required')
      return
    }
    const portNum = parseInt(port)
    if (isNaN(portNum) || portNum < 0 || portNum > 65535) {
      setError('Port must be a number between 0 and 65535')
      return
    }

    setError(null)
    setCreating(true)

    const response = await graphQLAddDeviceProductService(productId, {
      name: name.trim(),
      type,
      port: portNum,
      enabled,
    })

    if (graphQLGetErrors(response)) {
      setError('Failed to add service')
      setCreating(false)
      return
    }

    const service = response?.data?.data?.addDeviceProductService
    if (service) {
      onServiceAdded(service)
      handleClose()
    } else {
      setError('Failed to add service')
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Service</DialogTitle>
      <DialogContent>
        {error && (
          <Notice severity="error" fullWidth gutterBottom>
            {error}
          </Notice>
        )}

        <TextField
          label="Service Name"
          value={name}
          onChange={e => setName(e.target.value)}
          fullWidth
          required
          autoFocus
          margin="normal"
          disabled={creating}
        />

        <FormControl fullWidth margin="normal" required>
          <InputLabel>Service Type</InputLabel>
          <Select
            value={type}
            onChange={e => setType(e.target.value)}
            label="Service Type"
            disabled={creating}
          >
            {SERVICE_TYPES.map(t => (
              <MenuItem key={t.value} value={t.value}>
                {t.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Port"
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
          label="Enabled"
          sx={{ marginTop: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={creating}>
          Cancel
        </Button>
        <Button variant="contained" color="primary" onClick={handleCreate} disabled={creating}>
          {creating ? (
            <>
              <Icon name="spinner-third" spin size="sm" inline />
              Adding...
            </>
          ) : (
            'Add Service'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

