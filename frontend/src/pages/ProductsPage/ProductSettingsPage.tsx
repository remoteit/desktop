import React, { useState } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Button,
  Divider,
} from '@mui/material'
import { makeStyles } from '@mui/styles'
import { Container } from '../../components/Container'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import { Body } from '../../components/Body'
import { Notice } from '../../components/Notice'
import { Confirm } from '../../components/Confirm'
import { spacing } from '../../styling'
import { dispatch } from '../../store'
import { getProductModel } from '../../selectors/products'

export const ProductSettingsPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>()
  const history = useHistory()
  const css = useStyles()
  const { all: products } = useSelector(getProductModel)
  const product = products.find(p => p.id === productId)
  const [updating, setUpdating] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isLocked = product?.status === 'LOCKED'

  const handleLockToggle = async () => {
    if (!product || isLocked) return
    setUpdating(true)
    await dispatch.products.updateSettings({
      id: product.id,
      input: { lock: true },
    })
    setUpdating(false)
  }

  const handleDelete = async () => {
    if (!product) return
    setDeleting(true)
    const success = await dispatch.products.delete(product.id)
    setDeleting(false)
    if (success) {
      history.push('/products')
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

  return (
    <Container
      gutterBottom
      header={
        <Typography variant="h1">
          <Title>Product Settings</Title>
        </Typography>
      }
    >
      <div className={css.content}>
        <section className={css.section}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Product Details
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText
                primary="Platform"
                secondary={product.platform?.name || `Platform ${product.platform?.id}`}
              />
            </ListItem>
            <Divider component="li" />
            <ListItem>
              <ListItemText
                primary="Status"
                secondary={isLocked ? 'Locked' : 'Draft'}
              />
            </ListItem>
            <Divider component="li" />
            <ListItem>
              <ListItemText
                primary="Created"
                secondary={new Date(product.created).toLocaleString()}
              />
            </ListItem>
            <Divider component="li" />
            <ListItem>
              <ListItemText
                primary="Updated"
                secondary={new Date(product.updated).toLocaleString()}
              />
            </ListItem>
          </List>
        </section>

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
          </List>
        </section>

        <section className={css.section}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Danger Zone
          </Typography>
          <List>
            <ListItem>
              <ListItemText
                primary="Delete Product"
                secondary="Permanently delete this product and all its services."
              />
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => setDeleteOpen(true)}
                startIcon={<Icon name="trash" />}
              >
                Delete
              </Button>
            </ListItem>
          </List>
        </section>
      </div>

      <Confirm
        open={deleteOpen}
        onConfirm={handleDelete}
        onDeny={() => setDeleteOpen(false)}
        title="Delete Product"
        action={deleting ? 'Deleting...' : 'Delete'}
        disabled={deleting}
        color="error"
      >
        <Notice severity="error" gutterBottom fullWidth>
          This action cannot be undone.
        </Notice>
        <Typography variant="body2">
          Are you sure you want to permanently delete the product <b>{product.name}</b> and all its services?
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

