import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Typography } from '@mui/material'
import { ServiceForm } from '../../components/ServiceForm'
import { Container } from '../../components/Container'
import { Title } from '../../components/Title'
import { Notice } from '../../components/Notice'
import { Icon } from '../../components/Icon'
import { Body } from '../../components/Body'
import { Gutters } from '../../components/Gutters'
import { dispatch } from '../../store'
import { getProductModel } from '../../selectors/products'

export const ProductServiceAddPage: React.FC = () => {
  const { t } = useTranslation()
  const { productId } = useParams<{ productId: string }>()
  const history = useHistory()
  const { all: products } = useSelector(getProductModel)
  const product = products.find(p => p.id === productId)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string>()

  useEffect(() => {
    dispatch.applicationTypes.fetchAll()
  }, [])

  if (!product) {
    return (
      <Container gutterBottom>
        <Body center>
          <Icon name="exclamation-triangle" size="xxl" color="warning" />
          <Typography variant="h2" gutterBottom sx={{ marginTop: 2 }}>
            {t('productServiceAddPage.productNotFound', 'Product not found')}
          </Typography>
        </Body>
      </Container>
    )
  }

  return (
    <Container
      gutterBottom
      bodyProps={{ verticalOverflow: true }}
      integrated
      header={
        <Typography variant="h1">
          <Title>{t('productServiceAddPage.newService', 'New service')}</Title>
        </Typography>
      }
    >
      <Gutters>
        {error && (
          <Notice severity="error" fullWidth gutterBottom>
            {error}
          </Notice>
        )}
      </Gutters>

      <ServiceForm
        adding
        compact
        thisDevice={false}
        editable
        disabled={creating}
        onSubmit={async form => {
          setError(undefined)
          setCreating(true)
          const service = await dispatch.products.addService({
            productId,
            input: {
              name: (form.name || '').trim(),
              type: String(form.typeID),
              port: form.port || 1,
              enabled: !!form.enabled,
            },
          })
          setCreating(false)
          if (service) history.push(`/products/${productId}/${service.id}`)
          else setError(t('productServiceAddPage.failedToAddService', 'Failed to add service'))
        }}
        onCancel={() => history.push(`/products/${productId}`)}
        actionGuttersSize="xl"
      />
    </Container>
  )
}
