import React from 'react'
import { Switch, Route, useLocation, Redirect, useParams } from 'react-router-dom'
import { DynamicPanel } from '../components/DynamicPanel'
import { Panel } from '../components/Panel'
import { ProductsPage } from '../pages/ProductsPage/ProductsPage'
import { ProductAddPage } from '../pages/ProductsPage/ProductAddPage'
import { ProductPage } from '../pages/ProductsPage/ProductPage'
import { ProductSettingsPage } from '../pages/ProductsPage/ProductSettingsPage'
import { ProductServiceDetailPage } from '../pages/ProductsPage/ProductServiceDetailPage'
import { ProductServiceAddPage } from '../pages/ProductsPage/ProductServiceAddPage'
import { ProductTransferPage } from '../pages/ProductsPage/ProductTransferPage'

const ProductTertiaryRoutes: React.FC = () => {
  const { productId } = useParams<{ productId: string }>()

  return (
    <Switch>
      <Route path="/products/:productId/add">
        <ProductServiceAddPage />
      </Route>
      <Route path="/products/:productId/transfer">
        <ProductTransferPage />
      </Route>
      <Route path="/products/:productId/details">
        <Redirect to={`/products/${productId}`} />
      </Route>
      <Route path="/products/:productId/:serviceId">
        <ProductServiceDetailPage />
      </Route>
      <Route path="/products/:productId" exact>
        <ProductSettingsPage />
      </Route>
    </Switch>
  )
}

export const ProductsRouter: React.FC<{ layout: ILayout }> = ({ layout }) => {
  const location = useLocation()
  const locationParts = location.pathname.split('/')

  // Use single panel mode for base /products route
  if (locationParts[2] === undefined) {
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
      {/* Product detail routes */}
      <Route path="/products/:productId">
        <DynamicPanel
          primary={<ProductsPage />}
          secondary={<ProductPage />}
          tertiary={<ProductTertiaryRoutes />}
          layout={layout}
          root="/products/:productId"
          subRoot={[
            '/products/:productId/add',
            '/products/:productId/transfer',
            '/products/:productId/details',
            '/products/:productId/:serviceId',
            '/products/:productId',
          ]}
        />
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
