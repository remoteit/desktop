import React from 'react'
import { useHistory } from 'react-router-dom'
import { Switch, Route } from 'react-router-dom'
import { Button } from '@mui/material'
import { IconButton } from '../../buttons/IconButton'
import { Icon } from '../Icon'

export const ProductsHeaderButtons: React.FC = () => {
  const history = useHistory()

  return (
    <Route path={['/products', '/products/select']} exact>
      <Switch>
        <Route path="/products" exact>
          <IconButton to="/products/select" icon="check-square" title="Show Select" />
        </Route>
        <Route path="/products/select" exact>
          <IconButton to="/products" icon="check-square" type="solid" color="primary" title="Hide Select" />
        </Route>
      </Switch>
      <Button
        size="small"
        variant="contained"
        color="primary"
        onClick={() => history.push('/products/add')}
        startIcon={<Icon name="plus" />}
        sx={{ marginLeft: 1 }}
      >
        Create Product
      </Button>
    </Route>
  )
}

