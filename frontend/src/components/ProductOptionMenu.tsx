import React, { useState } from 'react'
import { Link, useHistory } from 'react-router-dom'
import { Divider, ListItemIcon, ListItemText, Menu, MenuItem, Typography } from '@mui/material'
import { IDeviceProduct } from '../models/products'
import { IconButton } from '../buttons/IconButton'
import { Icon } from './Icon'
import { DeleteButton } from '../buttons/DeleteButton'
import { Notice } from './Notice'
import { dispatch } from '../store'

type Props = { product?: IDeviceProduct }

export const ProductOptionMenu: React.FC<Props> = ({ product }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const history = useHistory()
  const handleClick = (event: React.MouseEvent<Element>) => setAnchorEl(event.currentTarget as HTMLButtonElement)
  const handleClose = () => setAnchorEl(null)

  if (!product) return null

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
          <ListItemText primary="Transfer Product" />
        </MenuItem>
        <Divider />
        <DeleteButton
          menuItem
          title="Delete Product"
          onCancel={handleClose}
          onDelete={async () => {
            handleClose()
            const success = await dispatch.products.delete(product.id)
            if (success) history.push('/products')
          }}
          warning={
            <>
              <Notice severity="error" gutterBottom fullWidth>
                This action cannot be undone.
              </Notice>
              <Typography variant="body2">
                Are you sure you want to permanently delete the product <b>{product.name}</b> and all its services?
              </Typography>
            </>
          }
        />
      </Menu>
    </>
  )
}
