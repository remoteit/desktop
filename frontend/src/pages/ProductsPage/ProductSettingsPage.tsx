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
  Box,
} from '@mui/material'
import { makeStyles } from '@mui/styles'
import { Container } from '../../components/Container'
import { Icon } from '../../components/Icon'
import { IconButton } from '../../buttons/IconButton'
import { CopyIconButton } from '../../buttons/CopyIconButton'
import { CopyCodeBlock } from '../../components/CopyCodeBlock'
import { Body } from '../../components/Body'
import { Notice } from '../../components/Notice'
import { Confirm } from '../../components/Confirm'
import { spacing } from '../../styling'
import { dispatch } from '../../store'
import { getProductModel } from '../../selectors/products'

type Props = {
  showBack?: boolean
}

export const ProductSettingsPage: React.FC<Props> = ({ showBack = true }) => {
  const { productId } = useParams<{ productId: string }>()
  const history = useHistory()
  const css = useStyles()
  const { all: products } = useSelector(getProductModel)
  const product = products.find(p => p.id === productId)
  
  const handleBack = () => {
    history.push(`/products/${productId}`)
  }
  const [updating, setUpdating] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isLocked = product?.status === 'LOCKED'
  const registrationCommand = product?.registrationCommand

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
        showBack ? (
          <Box sx={{ height: 45, display: 'flex', alignItems: 'center', paddingX: `${spacing.md}px`, marginTop: `${spacing.sm}px` }}>
            <IconButton
              icon="chevron-left"
              title="Back to Product"
              onClick={handleBack}
              size="md"
            />
          </Box>
        ) : undefined
      }
    >
      <div className={css.content}>
        {isLocked && product.registrationCode && (
          <section className={css.section}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              {registrationCommand ? 'Registration Command' : 'Registration Code'}
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom sx={{ marginBottom: 2 }}>
              {registrationCommand 
                ? 'Use this command to register devices with this product configuration:'
                : 'Use this registration code to register devices with this product configuration:'}
            </Typography>
            <CopyCodeBlock
              value={registrationCommand || product.registrationCode}
              code={registrationCommand ? product.registrationCode : undefined}
            />
          </section>
        )}

        <section className={css.section}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Product Details
          </Typography>
          <List dense>
            {isLocked && product.registrationCode && (
              <>
                <ListItem>
                  <ListItemText
                    primary="Registration Code"
                    secondary={product.registrationCode}
                  />
                  <ListItemSecondaryAction>
                    <CopyIconButton value={product.registrationCode} title="Copy Registration Code" size="md" />
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider component="li" />
              </>
            )}
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
            <Divider component="li" />
            <ListItem>
              <ListItemText
                primary="Product ID"
                secondary={product.id}
              />
              <ListItemSecondaryAction>
                <CopyIconButton value={product.id} title="Copy Product ID" size="md" />
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </section>

        <section className={css.section}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Product Settings
          </Typography>
          <List>
            <ListItem sx={{ paddingRight: '80px' }}>
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
            Transfer Ownership
          </Typography>
          <List>
            <ListItem>
              <ListItemText
                primary="Transfer Product"
                secondary="Transfer this product and all its services to another user."
              />
              <Button
                variant="outlined"
                size="small"
                onClick={() => history.push(`/products/${productId}/transfer`)}
                startIcon={<Icon name="arrow-turn-down-right" />}
              >
                Transfer
              </Button>
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
