import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Typography, Button, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import { Container } from '../../components/Container'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import { Notice } from '../../components/Notice'
import { Gutters } from '../../components/Gutters'
import { dispatch } from '../../store'
import { graphQLPlatformTypes } from '../../services/graphQLDeviceProducts'
import { graphQLGetErrors } from '../../services/graphQL'
import { selectPermissions } from '../../selectors/organizations'
import { byName } from '../../helpers/utilHelper'

interface IPlatformType {
  id: number
  name: string
  visible: boolean
}

export const ProductAddPage: React.FC = () => {
  const { t } = useTranslation()
  const history = useHistory()
  const admin = useSelector(selectPermissions).includes('ADMIN')
  const [name, setName] = useState('')
  const [platform, setPlatform] = useState('')
  const [platformTypes, setPlatformTypes] = useState<IPlatformType[]>([])
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPlatforms = async () => {
      const response = await graphQLPlatformTypes()
      if (response !== 'ERROR' && !graphQLGetErrors(response)) {
        const types: IPlatformType[] = response?.data?.data?.platformTypes || []
        setPlatformTypes(types.filter(p => p.visible).sort(byName))
      }
    }
    fetchPlatforms()
  }, [])

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!name.trim()) {
      setError(t('productAddPage.nameRequired', 'Product name is required'))
      return
    }
    if (!platform) {
      setError(t('productAddPage.platformRequired', 'Platform is required'))
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
      setError(t('productAddPage.createFailed', 'Failed to create product'))
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
          <Title>{t('productAddPage.title', 'Create Product')}</Title>
        </Typography>
      }
    >
      <Gutters>
        {!admin && (
          <Notice fullWidth gutterBottom>
            {t('productAddPage.adminRequired', 'You must have the admin permission to create a product.')}
          </Notice>
        )}
        {error && (
          <Notice severity="error" fullWidth gutterBottom>
            {error}
          </Notice>
        )}

        <form onSubmit={handleCreate}>
          <TextField
            variant="filled"
            label={t('productAddPage.productName', 'Product Name')}
            value={name}
            onChange={e => setName(e.target.value)}
            fullWidth
            required
            autoFocus
            margin="normal"
            disabled={!admin || creating}
          />

          <FormControl variant="filled" fullWidth margin="normal" required>
            <InputLabel>{t('productAddPage.platform', 'Platform')}</InputLabel>
            <Select
              value={platform}
              onChange={e => setPlatform(e.target.value)}
              label={t('productAddPage.platform', 'Platform')}
              disabled={!admin || creating || platformTypes.length === 0}
            >
              {platformTypes.map(p => (
                <MenuItem key={p.id} value={String(p.id)}>
                  {p.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Gutters top="lg" size={null}>
            <Button type="button" onClick={() => history.push('/products')} disabled={creating}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={!admin || creating}>
              {creating ? (
                <>
                  <Icon name="spinner-third" spin size="sm" inlineLeft />
                  {t('productAddPage.creating', 'Creating...')}
                </>
              ) : (
                t('productAddPage.title', 'Create Product')
              )}
            </Button>
          </Gutters>
        </form>
      </Gutters>
    </Container>
  )
}
