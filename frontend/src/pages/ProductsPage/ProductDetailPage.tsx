import React, { useState } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  Typography,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Divider,
  Chip,
} from '@mui/material'
import { makeStyles } from '@mui/styles'
import { Container } from '../../components/Container'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import { Body } from '../../components/Body'
import { Notice } from '../../components/Notice'
import { Confirm } from '../../components/Confirm'
import { LoadingMessage } from '../../components/LoadingMessage'
import { spacing } from '../../styling'
import { dispatch } from '../../store'
import { IProductService } from '../../models/products'
import { AddProductServiceDialog } from './AddProductServiceDialog'
import { getProductModel } from '../../selectors/products'

export const ProductDetailPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>()
  const history = useHistory()
  const css = useStyles()
  const { all: products, fetching, initialized } = useSelector(getProductModel)
  const product = products.find(p => p.id === productId)
  const [updating, setUpdating] = useState(false)
  const [addServiceOpen, setAddServiceOpen] = useState(false)
  const [deleteService, setDeleteService] = useState<IProductService | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleLockToggle = async () => {
    if (!product) return
    setUpdating(true)
    await dispatch.products.updateSettings({
      id: product.id,
      input: { lock: product.status !== 'LOCKED' },
    })
    setUpdating(false)
  }

  const handleHiddenToggle = async () => {
    if (!product) return
    setUpdating(true)
    await dispatch.products.updateSettings({
      id: product.id,
      input: { hidden: !product.hidden },
    })
    setUpdating(false)
  }

  const handleDeleteService = async () => {
    if (!deleteService || !product) return
    setDeleting(true)
    await dispatch.products.removeService({
      productId: product.id,
      serviceId: deleteService.id,
    })
    setDeleting(false)
    setDeleteService(null)
  }

  const handleServiceAdded = (service: IProductService) => {
    // Service is already added to store by AddProductServiceDialog
  }

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
          <Button variant="contained" onClick={() => history.push('/products')}>
            Back to Products
          </Button>
        </Body>
      </Container>
    )
  }

  return (
    <Container
      gutterBottom
      header={
        <>
          <Typography variant="h1">
            <IconButton onClick={() => history.push('/products')} sx={{ marginRight: 1 }}>
              <Icon name="chevron-left" size="md" />
            </IconButton>
            <Title>{product.name}</Title>
            <Chip
              size="small"
              label={isLocked ? 'Locked' : 'Draft'}
              color={isLocked ? 'primary' : 'default'}
              icon={<Icon name={isLocked ? 'lock' : 'pencil'} size="xs" />}
            />
          </Typography>
        </>
      }
    >
      <div className={css.content}>
        <section className={css.section}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Product Settings
          </Typography>
          <List>
            <ListItem>
              <ListItemText
                primary="Lock Product"
                secondary={
                  isLocked
                    ? 'This product is locked and cannot be unlocked.'
                    : 'Lock the product to enable bulk registration. Once locked, it cannot be unlocked.'
                }
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={isLocked}
                  onChange={handleLockToggle}
                  disabled={updating || isLocked}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <Divider variant="inset" component="li" />
            <ListItem>
              <ListItemText primary="Hidden" secondary="Hide this product from the products list" />
              <ListItemSecondaryAction>
                <Switch checked={product.hidden} onChange={handleHiddenToggle} disabled={updating} />
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </section>

        <section className={css.section}>
          <div className={css.sectionHeader}>
            <Typography variant="subtitle2" color="textSecondary">
              Services ({product.services.length})
            </Typography>
            {!isLocked && (
              <Button size="small" onClick={() => setAddServiceOpen(true)} startIcon={<Icon name="plus" />}>
                Add Service
              </Button>
            )}
          </div>
          {product.services.length === 0 ? (
            <Notice severity="info" fullWidth>
              No services defined. Add at least one service before locking the product.
            </Notice>
          ) : (
            <List>
              {product.services.map((service, index) => (
                <React.Fragment key={service.id}>
                  {index > 0 && <Divider variant="inset" component="li" />}
                  <ListItem>
                    <ListItemText
                      primary={service.name}
                      secondary={`Type: ${service.type?.name || 'Unknown'} | Port: ${service.port} | ${service.enabled ? 'Enabled' : 'Disabled'}`}
                    />
                    {!isLocked && (
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => setDeleteService(service)}
                          size="small"
                        >
                          <Icon name="trash" size="sm" />
                        </IconButton>
                      </ListItemSecondaryAction>
                    )}
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          )}
        </section>

        <section className={css.section}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Product Details
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="Platform" secondary={product.platform?.name || product.platform?.id} />
            </ListItem>
            {product.scope === 'PUBLIC' && (
              <ListItem>
                <ListItemText primary="Scope" secondary={product.scope.toLowerCase()} />
              </ListItem>
            )}
            <ListItem>
              <ListItemText primary="Created" secondary={new Date(product.created).toLocaleString()} />
            </ListItem>
            <ListItem>
              <ListItemText primary="Updated" secondary={new Date(product.updated).toLocaleString()} />
            </ListItem>
          </List>
        </section>
      </div>

      <AddProductServiceDialog
        open={addServiceOpen}
        productId={product.id}
        onClose={() => setAddServiceOpen(false)}
        onServiceAdded={handleServiceAdded}
      />

      <Confirm
        open={!!deleteService}
        onConfirm={handleDeleteService}
        onDeny={() => setDeleteService(null)}
        title="Remove Service"
        action={deleting ? 'Removing...' : 'Remove'}
        disabled={deleting}
      >
        <Notice severity="warning" gutterBottom fullWidth>
          This action cannot be undone.
        </Notice>
        <Typography variant="body2">
          Are you sure you want to remove the service <b>{deleteService?.name}</b>?
        </Typography>
      </Confirm>
    </Container>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  content: {
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
    backgroundColor: palette.white.main,
    borderRadius: 8,
    border: `1px solid ${palette.grayLighter.main}`,
    padding: spacing.md,
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
}))

