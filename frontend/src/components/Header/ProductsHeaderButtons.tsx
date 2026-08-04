import React from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Button, Tooltip } from '@mui/material'
import { IconButton } from '../../buttons/IconButton'
import { selectPermissions } from '../../selectors/organizations'
import { getHasProducts } from '../../selectors/products'
import { Icon } from '../Icon'

export const ProductsHeaderButtons: React.FC = () => {
  const history = useHistory()
  const location = useLocation()
  const hasProducts = useSelector(getHasProducts)
  const permissions = useSelector(selectPermissions)
  const { t } = useTranslation()

  const admin = permissions.includes('ADMIN')
  const isSelectMode = location.pathname === '/products/select'
  const adminRequired = admin ? '' : t('productsHeaderButtons.adminRequired', 'Admin permissions required')

  return (
    <>
      <IconButton
        hide={!hasProducts || !admin}
        to={isSelectMode ? '/products' : '/products/select'}
        icon="check-square"
        type={isSelectMode ? 'solid' : 'regular'}
        color={isSelectMode ? 'primary' : undefined}
        title={isSelectMode ? t('header.hideSelect', 'Hide Select') : t('header.showSelect', 'Show Select')}
      />
      <Tooltip title={adminRequired} placement="top" arrow>
        <span>
          <Button
            size="small"
            variant="contained"
            color="primary"
            disabled={!admin}
            onClick={() => history.push('/products/add')}
            startIcon={<Icon name="plus" />}
          >
            {t('header.create', 'Create')}
          </Button>
        </span>
      </Tooltip>
    </>
  )
}
