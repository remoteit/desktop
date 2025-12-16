import React from 'react'
import { Switch, Route, useLocation } from 'react-router-dom'
import { DynamicPanel } from '../components/DynamicPanel'
import { Panel } from '../components/Panel'
import { ProductsPage } from '../pages/ProductsPage/ProductsPage'
import { ProductAddPage } from '../pages/ProductsPage/ProductAddPage'
import { ProductsWithDetailPage } from '../pages/ProductsPage/ProductsWithDetailPage'

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
      {/* Product detail routes - custom three panel layout */}
      <Route path="/products/:productId">
        <Panel layout={layout} header={false}>
          <ProductsWithDetailPage />
        </Panel>
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
