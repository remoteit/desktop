import React, { useState, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { Typography, Button, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import { Container } from '../../components/Container'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import { Notice } from '../../components/Notice'
import { Gutters } from '../../components/Gutters'
import { dispatch } from '../../store'
import { graphQLPlatformTypes } from '../../services/graphQLDeviceProducts'
import { graphQLGetErrors } from '../../services/graphQL'

interface IPlatformType {
  id: number
  name: string
  visible: boolean
}

export const ProductAddPage: React.FC = () => {
  const history = useHistory()
  const [name, setName] = useState('')
  const [platform, setPlatform] = useState('')
  const [platformTypes, setPlatformTypes] = useState<IPlatformType[]>([])
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPlatforms = async () => {
      const response = await graphQLPlatformTypes()
      if (response !== 'ERROR' && !graphQLGetErrors(response)) {
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
      integrated
      gutterBottom
      bodyProps={{ verticalOverflow: true }}
      header={
        <Typography variant="h1">
          <Title>Create Product</Title>
        </Typography>
      }
    >
      <Gutters>
        {error && (
          <Notice severity="error" fullWidth gutterBottom>
            {error}
          </Notice>
        )}

        <TextField
          variant="filled"
          label="Product Name"
          value={name}
          onChange={e => setName(e.target.value)}
          fullWidth
          required
          autoFocus
          margin="normal"
          disabled={creating}
        />

        <FormControl variant="filled" fullWidth margin="normal" required>
          <InputLabel>Platform</InputLabel>
          <Select
            value={platform}
            onChange={e => setPlatform(e.target.value)}
            label="Platform"
            disabled={creating || platformTypes.length === 0}
          >
            {platformTypes
              .filter(p => p.visible)
              .map(p => (
                <MenuItem key={p.id} value={String(p.id)}>
                  {p.name}
                </MenuItem>
              ))}
          </Select>
        </FormControl>

        <Gutters top="lg" size={null}>
          <Button onClick={() => history.push('/products')} disabled={creating}>
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
        </Gutters>
      </Gutters>
    </Container>
  )
}
