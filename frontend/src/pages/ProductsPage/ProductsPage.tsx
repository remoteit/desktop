import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { Typography, Button, IconButton, Chip, FormControlLabel, Switch } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { Container } from '../../components/Container'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import { Body } from '../../components/Body'
import { Confirm } from '../../components/Confirm'
import { Notice } from '../../components/Notice'
import { LoadingMessage } from '../../components/LoadingMessage'
import { spacing } from '../../styling'
import {
  graphQLDeviceProducts,
  graphQLDeleteDeviceProduct,
} from '../../services/graphQLDeviceProducts'
import { graphQLGetErrors } from '../../services/graphQL'

interface IDeveloperProduct {
  id: string
  name: string
  platform: string
  scope: 'PUBLIC' | 'PRIVATE' | 'UNLISTED'
  status: 'NEW' | 'LOCKED'
  hidden: boolean
  created: string
  updated: string
  services: IProductService[]
}

interface IProductService {
  id: string
  name: string
  type: { id: number; name: string } | null
  port: number
  enabled: boolean
  platformCode: string
}

export const ProductsPage: React.FC = () => {
  const history = useHistory()
  const css = useStyles()
  const [products, setProducts] = useState<IDeveloperProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [showHidden, setShowHidden] = useState(false)
  const [deleteProduct, setDeleteProduct] = useState<IDeveloperProduct | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchProducts = async (includeHidden: boolean) => {
    setLoading(true)
    const response = await graphQLDeviceProducts({ includeHidden })
    if (!graphQLGetErrors(response)) {
      setProducts(response?.data?.data?.deviceProducts?.items || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchProducts(showHidden)
  }, [showHidden])

  const handleDelete = async () => {
    if (!deleteProduct) return
    setDeleting(true)
    const response = await graphQLDeleteDeviceProduct(deleteProduct.id)
    if (!graphQLGetErrors(response)) {
      setProducts(products.filter(p => p.id !== deleteProduct.id))
    }
    setDeleting(false)
    setDeleteProduct(null)
  }

  const getScopeColor = (scope: string): 'primary' | 'default' | 'secondary' => {
    switch (scope) {
      case 'PUBLIC':
        return 'primary'
      case 'PRIVATE':
        return 'secondary'
      default:
        return 'default'
    }
  }

  return (
    <Container
      gutterBottom
      header={
        <>
          <Typography variant="h1" gutterBottom>
            <Title>Products</Title>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={showHidden}
                  onChange={e => setShowHidden(e.target.checked)}
                />
              }
              label="Show hidden"
              sx={{ marginLeft: 2, marginRight: 2 }}
            />
            <Button
              size="small"
              variant="contained"
              color="primary"
              onClick={() => history.push('/products/add')}
            >
              <Icon name="plus" size="sm" inline />
              Create Product
            </Button>
          </Typography>
        </>
      }
    >
      {loading ? (
        <LoadingMessage message="Loading products..." />
      ) : products.length === 0 ? (
        <Body center>
          <Icon name="box-open" size="xxl" color="grayLight" />
          <Typography variant="h2" gutterBottom sx={{ marginTop: 2 }}>
            No products yet
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Products are used for bulk device registration and management.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            sx={{ marginTop: 2 }}
            onClick={() => history.push('/products/add')}
          >
            <Icon name="plus" size="sm" inline />
            Create your first product
          </Button>
        </Body>
      ) : (
        <div className={css.list}>
          {products.map(product => (
            <div key={product.id} className={css.item} onClick={() => history.push(`/products/${product.id}`)}>
              <div className={css.itemHeader}>
                <Typography variant="subtitle1">{product.name}</Typography>
                <div className={css.chips}>
                  {product.hidden && (
                    <Chip
                      size="small"
                      label="Hidden"
                      variant="outlined"
                      icon={<Icon name="eye-slash" size="xs" />}
                    />
                  )}
                  <Chip
                    size="small"
                    label={product.scope.toLowerCase()}
                    color={getScopeColor(product.scope)}
                  />
                  <Chip
                    size="small"
                    label={product.status === 'LOCKED' ? 'Locked' : 'Draft'}
                    variant={product.status === 'LOCKED' ? 'filled' : 'outlined'}
                    icon={<Icon name={product.status === 'LOCKED' ? 'lock' : 'pencil'} size="xs" />}
                  />
                </div>
              </div>
              <Typography variant="body2" color="textSecondary" className={css.details}>
                Platform: {product.platform} · Services: {product.services?.length || 0} · Updated: {new Date(product.updated).toLocaleDateString()}
              </Typography>
              <IconButton
                size="small"
                className={css.deleteButton}
                onClick={e => {
                  e.stopPropagation()
                  setDeleteProduct(product)
                }}
              >
                <Icon name="trash" size="sm" />
              </IconButton>
            </div>
          ))}
        </div>
      )}
      <Confirm
        open={!!deleteProduct}
        onConfirm={handleDelete}
        onDeny={() => setDeleteProduct(null)}
        title="Delete Product"
        action={deleting ? 'Deleting...' : 'Delete'}
        disabled={deleting}
      >
        <Notice severity="error" gutterBottom fullWidth>
          This action cannot be undone.
        </Notice>
        <Typography variant="body2">
          Are you sure you want to delete the product <b>{deleteProduct?.name}</b>?
          {deleteProduct && deleteProduct.services.length > 0 && (
            <>
              <br />
              <br />
              This will also delete {deleteProduct.services.length} associated service
              {deleteProduct.services.length > 1 ? 's' : ''}.
            </>
          )}
        </Typography>
      </Confirm>
    </Container>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
    padding: spacing.md,
  },
  item: {
    position: 'relative',
    padding: spacing.md,
    backgroundColor: palette.white.main,
    border: `1px solid ${palette.grayLighter.main}`,
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    '&:hover': {
      borderColor: palette.primary.main,
      boxShadow: `0 2px 8px ${palette.shadow.main}`,
    },
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  details: {
    marginTop: spacing.xs,
  },
  chips: {
    display: 'flex',
    gap: spacing.xs,
  },
  deleteButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    opacity: 0.5,
    '&:hover': {
      opacity: 1,
      color: palette.error.main,
    },
  },
}))

