import React from 'react'
import { useParams, useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Typography, List, ListItemText, Stack, Chip, Divider, Box } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { Container } from '../../components/Container'
import { ListItemLocation } from '../../components/ListItemLocation'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import { Body } from '../../components/Body'
import { Notice } from '../../components/Notice'
import { IconButton } from '../../buttons/IconButton'
import { LoadingMessage } from '../../components/LoadingMessage'
import { spacing } from '../../styling'
import { getProductModel } from '../../selectors/products'

export const ProductPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>()
  const history = useHistory()
  
  const handleBack = () => {
    history.push('/products')
  }
  const css = useStyles()
  const { all: products, fetching, initialized } = useSelector(getProductModel)
  const product = products.find(p => p.id === productId)

  const isLocked = product?.status === 'LOCKED'

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
        <Box>
          <Box sx={{ height: 45, display: 'flex', alignItems: 'center', paddingX: `${spacing.md}px`, marginTop: `${spacing.sm}px` }}>
            <IconButton
              icon="chevron-left"
              title="Back to Products"
              onClick={handleBack}
              size="md"
            />
          </Box>
          <List>
            <ListItemLocation
              to={`/products/${product.id}/details`}
              match={`/products/${product.id}/details`}
              icon={<Icon platform={product.platform?.id} platformIcon size="lg" color="grayDark" />}
              title={
                <Stack direction="row" alignItems="center" spacing={1} sx={{ marginRight: 1 }}>
                  <Title>{product.name}</Title>
                  <Chip
                    size="small"
                    label={isLocked ? 'Locked' : 'Draft'}
                    color={isLocked ? 'primary' : 'default'}
                    icon={<Icon name={isLocked ? 'lock' : 'pencil'} size="xs" />}
                  />
                </Stack>
              }
            />
            <Stack flexWrap="wrap" flexDirection="row" marginLeft={9} marginRight={3}>
              <Typography variant="caption" color="grayDarker.main">
                {product.platform?.name || `Platform ${product.platform?.id}`}
              </Typography>
            </Stack>
          </List>
        </Box>
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
        <Notice severity="info" gutterTop fullWidth>
          No services defined. Add at least one service before locking the product.
        </Notice>
      ) : (
        <List>
          {product.services.map((service, index) => (
            <React.Fragment key={service.id}>
              {index > 0 && <Divider variant="inset" />}
              <ListItemLocation
                to={`/products/${product.id}/${service.id}`}
                match={`/products/${product.id}/${service.id}`}
                dense
                icon={<Icon name={service.type?.name === 'SSH' ? 'terminal' : 'plug'} size="md" />}
              >
                <ListItemText
                  primary={service.name}
                  secondary={`${service.type?.name || 'Unknown'} · Port ${service.port}`}
                />
              </ListItemLocation>
            </React.Fragment>
          ))}
        </List>
      )}
    </Container>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  // Styles can be added as needed
}))

