import React, { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Typography, Box } from '@mui/material'
import { Container } from '../../components/Container'
import { Icon } from '../../components/Icon'
import { Body } from '../../components/Body'
import { LoadingMessage } from '../../components/LoadingMessage'
import { ProductList } from '../../components/ProductList'
import { ProductsActionBar } from '../../components/ProductsActionBar'
import { ListToolbar } from '../../components/ListToolbar'
import { ProductsToolbarButtons } from '../../components/Header/ProductsHeaderButtons'
import { useProductsOverview } from '../../hooks/useProductsOverview'
import { productAttributes } from '../../components/ProductAttributes'
import { removeObject } from '../../helpers/utilHelper'
import { dispatch, State } from '../../store'
import { getProductModel } from '../../selectors/products'
import { selectPermissions } from '../../selectors/organizations'

export const ProductsPage: React.FC<{ select?: boolean }> = ({ select }) => {
  const { t } = useTranslation()
  const { productId } = useParams<{ productId?: string }>()
  const admin = useSelector(selectPermissions).includes('ADMIN')
  const productModel = useSelector(getProductModel)
  const products = productModel.all || []
  const fetching = productModel.fetching || false
  const initialized = productModel.initialized || false
  const selected = productModel.selected || []
  const columnWidths = useSelector((state: State) => state.ui.columnWidths)
  const overview = useProductsOverview(products)
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
      {!selected.length && (
        <ListToolbar
          left={
            initialized && (
              <Typography variant="caption" color="textSecondary" noWrap>
                {t('productsPage.count', {
                  count: products.length,
                  defaultValue_one: '{{count}} product',
                  defaultValue_other: '{{count}} products',
                })}
              </Typography>
            )
          }
          right={<ProductsToolbarButtons />}
        />
      )}
      <Container
        integrated
        gutterBottom
        bodyProps={{ verticalOverflow: true, horizontalOverflow: true }}
      >
        {fetching && !initialized ? (
          <LoadingMessage message={t('productsPage.loading', 'Loading products...')} />
        ) : products.length === 0 ? (
          <Body center>
            <Icon name="conveyor-belt-boxes" size="xxl" color="grayLight" />
            <Typography variant="h2" align="center" sx={{ marginTop: 2 }}>
              {t('productsPage.emptyTitle', 'No products yet')}
            </Typography>
            <Typography variant="body2" align="center" color="textSecondary" sx={{ maxWidth: 420, marginY: 1 }}>
              {t(
                'productsPage.emptyHelp',
                'A product describes one kind of device. Register many devices of it with one join key.'
              )}
            </Typography>
            {!admin && (
              <Typography variant="body2" align="center" color="textSecondary" sx={{ maxWidth: 420 }}>
                {t('productsPage.emptyHelpAdmin', 'Ask an admin of this organization to create one.')}
              </Typography>
            )}
          </Body>
        ) : (
          <ProductList
            attributes={attributes}
            required={required}
            products={products}
            overview={overview}
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
