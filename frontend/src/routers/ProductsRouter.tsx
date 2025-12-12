import React from 'react'
import { Switch, Route, useLocation, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { DynamicPanel } from '../components/DynamicPanel'
import { Panel } from '../components/Panel'
import { ProductsPage } from '../pages/ProductsPage/ProductsPage'
import { ProductAddPage } from '../pages/ProductsPage/ProductAddPage'
import { ProductPage } from '../pages/ProductsPage/ProductPage'
import { ProductServiceDetailPage } from '../pages/ProductsPage/ProductServiceDetailPage'
import { ProductServiceAddPage } from '../pages/ProductsPage/ProductServiceAddPage'
import { ProductSettingsPage } from '../pages/ProductsPage/ProductSettingsPage'
import { getProductModel } from '../selectors/products'

export const ProductsRouter: React.FC<{ layout: ILayout }> = ({ layout }) => {
  const location = useLocation()
  const locationParts = location.pathname.split('/')

  // Use single panel mode for base /products route and /products/select
  if (locationParts[2] === undefined || locationParts[2] === 'select') {
    layout = { ...layout, singlePanel: true }
  }

  return (
    <Switch>
      {/* Products list with add panel */}
      <Route path="/products/add">
        <DynamicPanel
          primary={<ProductsPage />}
          secondary={<ProductAddPage />}
          layout={layout}
          root="/products"
        />
      </Route>
      {/* Products list select mode */}
      <Route path="/products/select">
        <Panel layout={layout}>
          <ProductsPage />
        </Panel>
      </Route>
      {/* Product detail routes - use ProductRouter for nested routing */}
      <Route path="/products/:productId">
        <ProductRouter layout={layout} />
      </Route>
      {/* Products list */}
      <Route path="/products" exact>
        <Panel layout={layout}>
          <ProductsPage />
        </Panel>
      </Route>
    </Switch>
  )
}

// Nested router for individual product pages
const ProductRouter: React.FC<{ layout: ILayout }> = ({ layout }) => {
  const { productId } = useParams<{ productId: string }>()
  const location = useLocation()
  const locationParts = location.pathname.split('/')
  const { all: products } = useSelector(getProductModel)
  const product = products.find(p => p.id === productId)

  // Single panel mode when just viewing product (no service selected)
  if (locationParts.length <= 3) {
    layout = { ...layout, singlePanel: true }
  }

  if (!product) {
    return (
      <Panel layout={layout}>
        <ProductPage />
      </Panel>
    )
  }

  return (
    <DynamicPanel
      primary={<ProductPage />}
      secondary={
        <Switch>
          <Route path="/products/:productId/add">
            <ProductServiceAddPage />
          </Route>
          <Route path="/products/:productId/details">
            <ProductSettingsPage />
          </Route>
          <Route path="/products/:productId/:serviceId">
            <ProductServiceDetailPage />
          </Route>
        </Switch>
      }
      layout={layout}
      root="/products/:productId"
    />
  )
}
