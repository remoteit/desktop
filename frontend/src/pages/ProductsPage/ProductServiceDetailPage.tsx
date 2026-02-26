import React, { useState } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
} from '@mui/material'
import { makeStyles } from '@mui/styles'
import { Container } from '../../components/Container'
import { Icon } from '../../components/Icon'
import { Body } from '../../components/Body'
import { Notice } from '../../components/Notice'
import { Confirm } from '../../components/Confirm'
import { spacing } from '../../styling'
import { dispatch } from '../../store'
import { getProductModel } from '../../selectors/products'

export const ProductServiceDetailPage: React.FC = () => {
  const { productId, serviceId } = useParams<{ productId: string; serviceId: string }>()
  const history = useHistory()
  const css = useStyles()
  const { all: products } = useSelector(getProductModel)
  const product = products.find(p => p.id === productId)
  const service = product?.services.find(s => s.id === serviceId)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isLocked = product?.status === 'LOCKED'

  const handleDelete = async () => {
    if (!product || !service) return
    setDeleting(true)
    const success = await dispatch.products.removeService({
      productId: product.id,
      serviceId: service.id,
    })
    setDeleting(false)
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
            Product not found
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
            Service not found
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            The service may have been removed.
          </Typography>
        </Body>
      </Container>
    )
  }

  return (
    <Container gutterBottom>
      <div className={css.content}>
        <section className={css.section}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Service Details
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText
                primary="Service Type"
                secondary={service.type?.name || 'Unknown'}
              />
            </ListItem>
            <Divider component="li" />
            <ListItem>
              <ListItemText
                primary="Port"
                secondary={service.port}
              />
            </ListItem>
            <Divider component="li" />
            <ListItem>
              <ListItemText
                primary="Status"
                secondary={service.enabled ? 'Enabled' : 'Disabled'}
              />
            </ListItem>
          </List>
        </section>

        {!isLocked && (
          <section className={css.section}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Danger Zone
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Remove Service"
                  secondary="Remove this service from the product."
                />
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={() => setDeleteOpen(true)}
                  startIcon={<Icon name="trash" />}
                >
                  Remove
                </Button>
              </ListItem>
            </List>
          </section>
        )}

        {isLocked && (
          <Notice severity="info" fullWidth>
            This product is locked. Services cannot be modified.
          </Notice>
        )}
      </div>

      <Confirm
        open={deleteOpen}
        onConfirm={handleDelete}
        onDeny={() => setDeleteOpen(false)}
        title="Remove Service"
        action={deleting ? 'Removing...' : 'Remove'}
        disabled={deleting}
      >
        <Notice severity="warning" gutterBottom fullWidth>
          This action cannot be undone.
        </Notice>
        <Typography variant="body2">
          Are you sure you want to remove the service <b>{service.name}</b>?
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
}))
