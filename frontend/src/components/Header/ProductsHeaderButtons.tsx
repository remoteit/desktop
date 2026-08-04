import React from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Button } from '@mui/material'
import { IconButton } from '../../buttons/IconButton'
import { getProducts } from '../../selectors/products'
import { Icon } from '../Icon'

export const ProductsHeaderButtons: React.FC = () => {
  const history = useHistory()
  const location = useLocation()
  const hasProducts = useSelector(getProducts).length > 0

  const searchParams = new URLSearchParams(location.search)
  const isSelectMode = searchParams.get('select') === 'true'

  const toggleSelect = () => {
    const newParams = new URLSearchParams(location.search)
    if (isSelectMode) {
      newParams.delete('select')
    } else {
      newParams.set('select', 'true')
    }
    const search = newParams.toString()
    history.push(`${location.pathname}${search ? `?${search}` : ''}`)
  }

  return (
    <>
      {hasProducts && (
        <IconButton
          onClick={toggleSelect}
          icon="check-square"
          type={isSelectMode ? 'solid' : 'regular'}
          color={isSelectMode ? 'primary' : undefined}
          title={isSelectMode ? 'Hide Select' : 'Show Select'}
        />
      )}
      <Button
        size="small"
        variant="contained"
        color="primary"
        onClick={() => history.push('/products/add')}
        startIcon={<Icon name="plus" />}
      >
        Create
      </Button>
    </>
  )
}

