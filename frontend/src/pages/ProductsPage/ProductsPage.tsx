import React, { useEffect } from 'react'
import { useHistory, useLocation, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Typography, Button, Box } from '@mui/material'
import { Container } from '../../components/Container'
import { Icon } from '../../components/Icon'
import { Body } from '../../components/Body'
import { LoadingMessage } from '../../components/LoadingMessage'
import { ProductList } from '../../components/ProductList'
import { ProductsActionBar } from '../../components/ProductsActionBar'
import { productAttributes } from '../../components/ProductAttributes'
import { removeObject } from '../../helpers/utilHelper'
import { dispatch, State } from '../../store'
import { getProductModel } from '../../selectors/products'

export const ProductsPage: React.FC = () => {
  const history = useHistory()
  const location = useLocation()
  const { t } = useTranslation()
  const { productId } = useParams<{ productId?: string }>()
  const searchParams = new URLSearchParams(location.search)
  const select = searchParams.get('select') === 'true'
  const productModel = useSelector(getProductModel)
  const products = productModel.all || []
  const fetching = productModel.fetching || false
  const initialized = productModel.initialized || false
  const selected = productModel.selected || []
  const columnWidths = useSelector((state: State) => state.ui.columnWidths)
  const [required, attributes] = removeObject(
    productAttributes.filter(a => a.id !== 'productPlatform'),
    a => a.required === true
  )

  useEffect(() => {
    dispatch.products.fetchIfEmpty()
  }, [])

  // Clear selection when leaving select mode
  useEffect(() => {
    if (!select && selected.length > 0) {
      dispatch.products.clearSelection()
    }
  }, [select])

  const handleSelect = (id: string) => {
    dispatch.products.select(id)
  }

  const handleSelectAll = (checked: boolean) => {
    dispatch.products.selectAll(checked)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <ProductsActionBar select={select} />
      <Container
        integrated
        gutterBottom
        bodyProps={{ verticalOverflow: true, horizontalOverflow: true }}
      >
        {fetching && !initialized ? (
          <LoadingMessage message={t('productsPage.loading', 'Loading products...')} />
        ) : products.length === 0 ? (
          <Body center>
            <Button variant="contained" color="primary" size="medium" onClick={() => history.push('/products/add')}>
              <Icon name="plus" type="solid" inlineLeft /> {t('productsPage.createFirst', 'Create your first product')}
            </Button>
            <Typography variant="body2" align="center" color="textSecondary" sx={{ maxWidth: 500, padding: 3 }}>
              {t('productsPage.emptyHelp', 'Products are used for bulk device registration and management.')}
            </Typography>
          </Body>
        ) : (
          <ProductList
            attributes={attributes}
            required={required}
            products={products}
            columnWidths={columnWidths}
            fetching={fetching}
            select={select}
            selected={selected}
            activeProductId={productId}
            onSelect={handleSelect}
            onSelectAll={handleSelectAll}
          />
        )}
      </Container>
    </Box>
  )
}
