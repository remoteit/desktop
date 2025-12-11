import React, { useState, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import {
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
} from '@mui/material'
import { makeStyles } from '@mui/styles'
import { Container } from '../../components/Container'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import { Notice } from '../../components/Notice'
import { spacing } from '../../styling'
import { dispatch } from '../../store'
import { graphQLPlatformTypes } from '../../services/graphQLDeviceProducts'
import { graphQLGetErrors } from '../../services/graphQL'

interface IPlatformType {
  id: number
  name: string
}

export const ProductAddPage: React.FC = () => {
  const history = useHistory()
  const css = useStyles()
  const [name, setName] = useState('')
  const [platform, setPlatform] = useState('')
  const [platformTypes, setPlatformTypes] = useState<IPlatformType[]>([])
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPlatforms = async () => {
      const response = await graphQLPlatformTypes()
      if (!graphQLGetErrors(response)) {
        setPlatformTypes(response?.data?.data?.platformTypes || [])
      }
    }
    fetchPlatforms()
  }, [])

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Product name is required')
      return
    }
    if (!platform) {
      setError('Platform is required')
      return
    }

    setError(null)
    setCreating(true)

    const product = await dispatch.products.create({
      name: name.trim(),
      platform,
    })

    if (product) {
      history.push(`/products/${product.id}`)
    } else {
      setError('Failed to create product')
      setCreating(false)
    }
  }

  return (
    <Container
      gutterBottom
      header={
        <Typography variant="h1">
          <IconButton onClick={() => history.push('/products')} sx={{ marginRight: 1 }}>
            <Icon name="chevron-left" size="md" />
          </IconButton>
          <Title>Create Product</Title>
        </Typography>
      }
    >
      <div className={css.form}>
        {error && (
          <Notice severity="error" fullWidth gutterBottom>
            {error}
          </Notice>
        )}

        <TextField
          label="Product Name"
          value={name}
          onChange={e => setName(e.target.value)}
          fullWidth
          required
          autoFocus
          margin="normal"
          disabled={creating}
        />

        <FormControl fullWidth margin="normal" required>
          <InputLabel>Platform</InputLabel>
          <Select
            value={platform}
            onChange={e => setPlatform(e.target.value)}
            label="Platform"
            disabled={creating || platformTypes.length === 0}
          >
            {platformTypes.map(p => (
              <MenuItem key={p.id} value={String(p.id)}>
                {p.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <div className={css.actions}>
          <Button variant="outlined" onClick={() => history.push('/products')} disabled={creating}>
            Cancel
          </Button>
          <Button variant="contained" color="primary" onClick={handleCreate} disabled={creating}>
            {creating ? (
              <>
                <Icon name="spinner-third" spin size="sm" inline />
                Creating...
              </>
            ) : (
              'Create Product'
            )}
          </Button>
        </div>
      </div>
    </Container>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  form: {
    maxWidth: 500,
    margin: '0 auto',
    padding: spacing.lg,
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
}))

