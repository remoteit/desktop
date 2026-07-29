import React from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Typography } from '@mui/material'
import { Icon } from '../../components/Icon'
import { Body } from '../../components/Body'
import { Notice } from '../../components/Notice'
import { Gutters } from '../../components/Gutters'
import { DataDisplay } from '../../components/DataDisplay'
import { Container } from '../../components/Container'
import { ProductServiceHeaderMenu } from '../../components/ProductServiceHeaderMenu'
import { productServiceDetailAttributes } from '../../components/ProductAttributes'
import { DeleteButton } from '../../buttons/DeleteButton'
import { dispatch } from '../../store'
import { getProductModel } from '../../selectors/products'

export const ProductServiceDetailPage: React.FC = () => {
  const { t } = useTranslation()
  const { productId, serviceId } = useParams<{ productId: string; serviceId: string }>()
  const history = useHistory()
  const { all: products } = useSelector(getProductModel)
  const product = products.find(p => p.id === productId)
  const service = product?.services.find(s => s.id === serviceId)

  const handleDelete = async () => {
    if (!product || !service) return
    const success = await dispatch.products.removeService({
      productId: product.id,
      serviceId: service.id,
    })
    if (success) {
      history.push(`/products/${product.id}`)
    }
  }

  if (!product) {
    return (
      <Container gutterBottom>
        <Body center>
          <Icon name="exclamation-triangle" size="xxl" color="warning" />
          <Typography variant="h2" gutterBottom sx={{ marginTop: 2 }}>
            {t('productServiceDetailPage.productNotFound', 'Product not found')}
          </Typography>
        </Body>
      </Container>
    )
  }

  if (!service) {
    return (
      <Container gutterBottom>
        <Body center>
          <Icon name="exclamation-triangle" size="xxl" color="warning" />
          <Typography variant="h2" gutterBottom sx={{ marginTop: 2 }}>
            {t('productServiceDetailPage.serviceNotFound', 'Service not found')}
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            {t('productServiceDetailPage.serviceMayHaveBeenRemoved', 'The service may have been removed.')}
          </Typography>
        </Body>
      </Container>
    )
  }

  return (
    <ProductServiceHeaderMenu
      product={product}
      service={service}
      action={
        <DeleteButton
          title={t('productServiceDetailPage.removeService', 'Remove Service')}
          icon="trash"
          onDelete={handleDelete}
          warning={
            <Notice severity="error" fullWidth>
              {t('productServiceDetailPage.removeServiceConfirmPrefix', 'Are you sure you want to remove the service')}{' '}
              <b>{service.name}</b>?{' '}
              {t('productServiceDetailPage.actionCannotBeUndone', 'This action cannot be undone.')}
            </Notice>
          }
        />
      }
    >
      <Gutters>
        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
          {t('productServiceDetailPage.details', 'Details')}
        </Typography>
        <DataDisplay product={product} productService={service} attributes={productServiceDetailAttributes} />
      </Gutters>
    </ProductServiceHeaderMenu>
  )
}
