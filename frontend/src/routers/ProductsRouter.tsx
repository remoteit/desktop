import React from 'react'
import { Switch, Route, useLocation } from 'react-router-dom'
import { DynamicPanel } from '../components/DynamicPanel'
import { ProductsPage } from '../pages/ProductsPage/ProductsPage'
import { ProductAddPage } from '../pages/ProductsPage/ProductAddPage'
import { ProductDetailPage } from '../pages/ProductsPage/ProductDetailPage'

export const ProductsRouter: React.FC<{ layout: ILayout }> = ({ layout }) => {
  const location = useLocation()
  const locationParts = location.pathname.split('/')

  // Use single panel mode for base /products route and /products/select
  if (locationParts[2] === undefined || locationParts[2] === 'select') {
    layout = { ...layout, singlePanel: true }
  }

  return (
    <DynamicPanel
      primary={
        <Switch>
          <Route path="/products/select">
            <ProductsPage />
          </Route>
          <Route path="/products">
            <ProductsPage />
          </Route>
        </Switch>
      }
      secondary={
        <Switch>
          <Route path="/products/add">
            <ProductAddPage />
          </Route>
          <Route path="/products/:productId">
            <ProductDetailPage />
          </Route>
        </Switch>
      }
      layout={layout}
      root={['/products', '/products/select']}
    />
  )
}

