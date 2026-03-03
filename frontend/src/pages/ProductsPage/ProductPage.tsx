import React, { useEffect } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Typography, List, Stack, ListItemText } from '@mui/material'
import { Container } from '../../components/Container'
import { ListItemLocation } from '../../components/ListItemLocation'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import { Body } from '../../components/Body'
import { Notice } from '../../components/Notice'
import { IconButton } from '../../buttons/IconButton'
import { LoadingMessage } from '../../components/LoadingMessage'
import { ProductStatusChip } from '../../components/ProductStatusChip'
import { ColorChip } from '../../components/ColorChip'
import { dispatch } from '../../store'
import { getProductModel } from '../../selectors/products'
import { spacing } from '../../styling'
import { Gutters } from '../../components/Gutters'

export const ProductPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>()
  const history = useHistory()
  const { all: products, fetching, initialized } = useSelector(getProductModel)
  const product = products.find(p => p.id === productId)

  const isLocked = product?.status === 'LOCKED'

  // Refresh product data when loading
  useEffect(() => {
    if (productId) {
      dispatch.products.fetchSingle(productId)
    }
  }, [productId])

  if (fetching && !initialized) {
    return (
      <Container gutterBottom>
        <LoadingMessage message="Loading product..." />
      </Container>
    )
  }

  if (!product) {
    return (
      <Container gutterBottom>
        <Body center>
          <Icon name="exclamation-triangle" size="xxl" color="warning" />
          <Typography variant="h2" gutterBottom sx={{ marginTop: 2 }}>
            Product not found
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            The product may have been deleted or you don't have access to it.
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
              title={
                <Stack direction="row" alignItems="center" spacing={1} sx={{ marginRight: 1 }}>
                  <Title>{product.name}</Title>
                  <ProductStatusChip status={product.status} />
                </Stack>
              }
            />
            <Stack flexWrap="wrap" flexDirection="row" marginLeft={9.5} marginRight={3}>
              <Typography variant="caption" color="grayDarker.main" gutterBottom>
                {product.platform?.name || `Platform ${product.platform?.id}`}
              </Typography>
            </Stack>
          </List>
        </>
      }
    >
      <Typography variant="subtitle1">
        <Title>Service</Title>
        {!isLocked && (
          <IconButton
            icon="plus"
            title="Add Service"
            onClick={() => history.push(`/products/${product.id}/add`)}
            size="md"
          />
        )}
      </Typography>

      {product.services.length === 0 ? (
        <Gutters>
          <Notice severity="info" gutterTop fullWidth>
            No services defined. Add at least one service before locking the product.
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
                label={service.type?.name || 'Unknown'}
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
