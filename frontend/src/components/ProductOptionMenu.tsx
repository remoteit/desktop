import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Divider, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip, Typography } from '@mui/material'
import { IDeviceProduct } from '../models/products'
import { IconButton } from '../buttons/IconButton'
import { selectPermissions } from '../selectors/organizations'
import { Icon } from './Icon'
import { DeleteButton } from '../buttons/DeleteButton'
import { Notice } from './Notice'
import { dispatch } from '../store'

type Props = { product?: IDeviceProduct }

export const ProductOptionMenu: React.FC<Props> = ({ product }) => {
  const { t } = useTranslation()
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const history = useHistory()
  const admin = useSelector(selectPermissions).includes('ADMIN')
  const handleClick = (event: React.MouseEvent<Element>) => setAnchorEl(event.currentTarget as HTMLButtonElement)
  const handleClose = () => setAnchorEl(null)

  if (!product) return null

  const deleteButton = (
    <DeleteButton
      menuItem
      disabled={!admin}
      title={t('productOptionMenu.deleteProduct', 'Delete Product')}
      onCancel={handleClose}
      onDelete={async () => {
        handleClose()
        const success = await dispatch.products.delete(product.id)
        if (success) history.push('/products')
      }}
      warning={
        <>
          <Notice severity="error" gutterBottom fullWidth>
            {t('productOptionMenu.cannotBeUndone', 'This action cannot be undone.')}
          </Notice>
          <Typography variant="body2">
            {t('productOptionMenu.deleteConfirmPrefix', 'Are you sure you want to permanently delete the product')}{' '}
            <b>{product.name}</b> {t('productOptionMenu.deleteConfirmSuffix', 'and all its services?')}
          </Typography>
        </>
      }
    />
  )

  return (
    <>
      <IconButton onClick={handleClick} name="ellipsis-v" size="md" color="grayDarker" fixedWidth />
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        disableScrollLock
        autoFocus={false}
        elevation={2}
      >
        <MenuItem dense to={`/products/${product.id}/transfer`} component={Link} onClick={handleClose}>
          <ListItemIcon>
            <Icon name="arrow-turn-down-right" size="md" />
          </ListItemIcon>
          <ListItemText primary={t('productOptionMenu.transferProduct', 'Transfer Product')} />
        </MenuItem>
        <Divider />
        {admin ? (
          deleteButton
        ) : (
          <Tooltip placement="left" title={t('productOptionMenu.adminRequired', 'Admin permissions required')} arrow>
            <span>{deleteButton}</span>
          </Tooltip>
        )}
      </Menu>
    </>
  )
}
