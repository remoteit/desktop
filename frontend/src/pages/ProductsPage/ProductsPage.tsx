import React, { useEffect, useMemo } from 'react'
import { useHistory, useRouteMatch } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Typography, Button } from '@mui/material'
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
  const selectMatch = useRouteMatch('/products/select')
  const select = !!selectMatch
  const productModel = useSelector(getProductModel)
  const allProducts = productModel.all || []
  const fetching = productModel.fetching || false
  const initialized = productModel.initialized || false
  const selected = productModel.selected || []
  const showHidden = productModel.showHidden || false
  const columnWidths = useSelector((state: State) => state.ui.columnWidths)
  const [required, attributes] = removeObject(productAttributes, a => a.required === true)

  const products = useMemo(() => {
    return showHidden ? allProducts : allProducts.filter(p => !p.hidden)
  }, [allProducts, showHidden])

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
    <Container
      integrated
      gutterBottom
      bodyProps={{ verticalOverflow: true, horizontalOverflow: true }}
      header={<ProductsActionBar select={select} />}
    >
      {fetching && !initialized ? (
        <LoadingMessage message="Loading products..." />
      ) : products.length === 0 ? (
        <Body center>
          <Icon name="box-open" size="xxl" color="grayLight" />
          <Typography variant="h2" gutterBottom sx={{ marginTop: 2 }}>
            {showHidden ? 'No products' : 'No visible products'}
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            {showHidden
              ? 'Products are used for bulk device registration and management.'
              : 'All products may be hidden. Click the eye icon to show hidden products.'}
          </Typography>
          {!showHidden && allProducts.length > 0 ? (
            <Button
              variant="outlined"
              sx={{ marginTop: 2 }}
              onClick={() => dispatch.products.toggleShowHidden()}
            >
              <Icon name="eye" size="sm" inline />
              Show hidden products
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              sx={{ marginTop: 2 }}
              onClick={() => history.push('/products/add')}
            >
              <Icon name="plus" size="sm" inline />
              Create your first product
            </Button>
          )}
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
          onSelect={handleSelect}
          onSelectAll={handleSelectAll}
        />
      )}
    </Container>
  )
}
