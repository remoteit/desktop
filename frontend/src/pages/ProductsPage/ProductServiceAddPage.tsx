import React, { useState } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Box,
} from '@mui/material'
import { makeStyles } from '@mui/styles'
import { Container } from '../../components/Container'
import { Icon } from '../../components/Icon'
import { IconButton } from '../../buttons/IconButton'
import { Body } from '../../components/Body'
import { Notice } from '../../components/Notice'
import { spacing } from '../../styling'
import { dispatch, State } from '../../store'
import { getProductModel } from '../../selectors/products'

type Props = {
  showBack?: boolean
}

export const ProductServiceAddPage: React.FC<Props> = ({ showBack = true }) => {
  const { productId } = useParams<{ productId: string }>()
  const history = useHistory()
  const css = useStyles()
  const applicationTypes = useSelector((state: State) => state.applicationTypes.all)
  const { all: products } = useSelector(getProductModel)
  const product = products.find(p => p.id === productId)
  
  const handleBack = () => {
    history.push(`/products/${productId}`)
  }

  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [port, setPort] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isLocked = product?.status === 'LOCKED'

  const handleTypeChange = (selectedType: string) => {
    setType(selectedType)
    // Set default port for the selected application type
    const appType = applicationTypes.find(t => String(t.id) === selectedType)
    if (appType?.port) {
      setPort(String(appType.port))
    }
  }

  const handleCreate = async () => {
    if (!productId) return
    
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

    const service = await dispatch.products.addService({
      productId,
      input: {
        name: name.trim(),
        type,
        port: portNum,
        enabled,
      },
    })

    setCreating(false)

    if (service) {
      history.push(`/products/${productId}/${service.id}`)
    } else {
      setError('Failed to add service')
    }
  }

  if (!product) {
    return (
      <Container gutterBottom>
        <Body center>
          <Icon name="exclamation-triangle" size="xxl" color="warning" />
          <Typography variant="h2" gutterBottom sx={{ marginTop: 2 }}>
            Product not found
          </Typography>
        </Body>
      </Container>
    )
  }

  if (isLocked) {
    return (
      <Container gutterBottom>
        <Body center>
          <Icon name="lock" size="xxl" color="grayDark" />
          <Typography variant="h2" gutterBottom sx={{ marginTop: 2 }}>
            Product is locked
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Services cannot be added to a locked product.
          </Typography>
        </Body>
      </Container>
    )
  }

  return (
    <Container 
      gutterBottom
      header={
        showBack ? (
          <Box sx={{ height: 45, display: 'flex', alignItems: 'center', paddingX: `${spacing.md}px`, marginTop: `${spacing.sm}px` }}>
            <IconButton
              icon="chevron-left"
              title="Back to Product"
              onClick={handleBack}
              size="md"
            />
          </Box>
        ) : undefined
      }
    >
      <div className={css.content}>
        {error && (
          <Notice severity="error" fullWidth gutterBottom>
            {error}
          </Notice>
        )}

        <Box className={css.form}>
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
              onChange={e => handleTypeChange(e.target.value)}
              label="Service Type"
              disabled={creating}
            >
              {applicationTypes.map(t => (
                <MenuItem key={t.id} value={String(t.id)}>
                  {t.name}
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
            sx={{ marginTop: 2 }}
          />

          <Box className={css.actions}>
            <Button
              onClick={() => history.push(`/products/${productId}`)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreate}
              disabled={creating}
            >
              {creating ? (
                <>
                  <Icon name="spinner-third" spin size="sm" inline />
                  Adding...
                </>
              ) : (
                'Add Service'
              )}
            </Button>
          </Box>
        </Box>
      </div>
    </Container>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  content: {
    padding: spacing.md,
  },
  form: {
    backgroundColor: palette.white.main,
    borderRadius: 8,
    border: `1px solid ${palette.grayLighter.main}`,
    padding: spacing.md,
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
}))

