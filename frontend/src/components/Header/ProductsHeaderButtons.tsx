import React from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Button } from '@mui/material'
import { IconButton } from '../../buttons/IconButton'
import { getHasProducts } from '../../selectors/products'
import { Icon } from '../Icon'

export const ProductsHeaderButtons: React.FC = () => {
  const history = useHistory()
  const location = useLocation()
  const hasProducts = useSelector(getHasProducts)
  const { t } = useTranslation()

  const searchParams = new URLSearchParams(location.search)
  const isSelectMode = searchParams.get('select') === 'true'

  // Same params with `select` flipped — the destination the toggle navigates to.
  isSelectMode ? searchParams.delete('select') : searchParams.set('select', 'true')
  const search = searchParams.toString()

  return (
    <>
      <IconButton
        hide={!hasProducts}
        to={`${location.pathname}${search ? `?${search}` : ''}`}
        icon="check-square"
        type={isSelectMode ? 'solid' : 'regular'}
        color={isSelectMode ? 'primary' : undefined}
        title={isSelectMode ? t('header.hideSelect', 'Hide Select') : t('header.showSelect', 'Show Select')}
      />
      <Button
        size="small"
        variant="contained"
        color="primary"
        onClick={() => history.push('/products/add')}
        startIcon={<Icon name="plus" />}
      >
        {t('header.create', 'Create')}
      </Button>
    </>
  )
}

