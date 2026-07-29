import React, { useEffect } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Typography, List, Stack, ListItemText } from '@mui/material'
import { Container } from '../../components/Container'
import { ListItemLocation } from '../../components/ListItemLocation'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import { Body } from '../../components/Body'
import { Notice } from '../../components/Notice'
import { IconButton } from '../../buttons/IconButton'
import { LoadingMessage } from '../../components/LoadingMessage'
import { ColorChip } from '../../components/ColorChip'
import { ProductTagEditor } from '../../components/ProductTagEditor'
import { dispatch } from '../../store'
import { getProductModel } from '../../selectors/products'
import { spacing } from '../../styling'
import { Gutters } from '../../components/Gutters'

export const ProductPage: React.FC = () => {
  const { t } = useTranslation()
  const { productId } = useParams<{ productId: string }>()
  const history = useHistory()
  const { all: products, fetching, initialized } = useSelector(getProductModel)
  const product = products.find(p => p.id === productId)

  useEffect(() => {
    if (productId) {
      dispatch.products.fetchSingle(productId)
    }
  }, [productId])

  useEffect(() => {
    dispatch.tags.fetchIfEmpty()
  }, [])

  if (fetching && !initialized) {
    return (
      <Container gutterBottom>
        <LoadingMessage message={t('productPage.loadingProduct', 'Loading product...')} />
      </Container>
    )
  }

  if (!product) {
    return (
      <Container gutterBottom>
        <Body center>
          <Icon name="exclamation-triangle" size="xxl" color="warning" />
          <Typography variant="h2" gutterBottom sx={{ marginTop: 2 }}>
            {t('productPage.productNotFound', 'Product not found')}
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            {t(
              'productPage.productNotFoundHint',
              "The product may have been deleted or you don't have access to it."
            )}
          </Typography>
        </Body>
      </Container>
    )
  }

  return (
    <Container
      bodyProps={{ verticalOverflow: true }}
      header={
        <>
          <List>
            <ListItemLocation
              to={`/products/${product.id}/details`}
              match={`/products/${product.id}/details`}
              icon={<Icon platform={product.platform?.id} platformIcon size="lg" color="grayDark" />}
              title={<Title>{product.name}</Title>}
            />
            <Stack flexWrap="wrap" flexDirection="row" marginLeft={9.5} marginRight={3}>
              <Typography variant="caption" color="grayDarker.main" gutterBottom sx={{ width: '100%' }}>
                {product.platform?.name ||
                  t('productPage.platformId', { id: product.platform?.id, defaultValue: 'Platform {{id}}' })}
              </Typography>
            </Stack>
            <Stack flexWrap="wrap" flexDirection="row" marginLeft={9.5} marginRight={3}>
              <ProductTagEditor product={product} />
            </Stack>
          </List>
        </>
      }
    >
      <Typography variant="subtitle1">
        <Title>{t('productPage.service', 'Service')}</Title>
        <IconButton
          icon="plus"
          title={t('productPage.addService', 'Add Service')}
          onClick={() => history.push(`/products/${product.id}/add`)}
          size="md"
        />
      </Typography>

      {product.services.length === 0 ? (
        <Gutters>
          <Notice severity="info" gutterTop fullWidth>
            {t('productPage.noServicesDefined', 'No services defined. Add at least one service to this product.')}
          </Notice>
        </Gutters>
      ) : (
        <List sx={{ '& .MuiListItem-root': { paddingRight: spacing.sm } }}>
          {product.services.map(service => (
            <ListItemLocation
              key={service.id}
              to={`/products/${product.id}/${service.id}`}
              match={`/products/${product.id}/${service.id}`}
              dense
              inset={1.5}
            >
              <IconButton
                icon={service.type?.name === 'SSH' ? 'terminal' : 'port'}
                size="sm"
                buttonBaseSize="small"
                color={service.enabled ? 'primary' : 'grayDark'}
                type="solid"
                hideDisableFade
                sx={{ marginLeft: 0.375, marginRight: 0.75 }}
              />
              <ListItemText
                primary={
                  <Typography variant="body1" sx={{ opacity: service.enabled ? 1 : 0.55 }}>
                    {service.name}
                  </Typography>
                }
              />
              <ColorChip
                size="small"
                label={service.type?.name || t('productPage.unknown', 'Unknown')}
                color="grayDark"
                variant="text"
                sx={{ marginRight: 1 }}
              />
            </ListItemLocation>
          ))}
        </List>
      )}
    </Container>
  )
}
