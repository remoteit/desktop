import React from 'react'
import { useTranslation } from 'react-i18next'
import { Box, List, Typography } from '@mui/material'
import { ProductDevice } from '../services/productPolicy'
import { ListItemLocation } from './ListItemLocation'

/* The devices that belong to a product now (Device.product): those it registered, and those attached to it since. Each
   to its own page, where its product is changed or detached. */
export const ProductDevices: React.FC<{ devices: ProductDevice[] }> = ({ devices }) => {
  const { t } = useTranslation()
  return (
    <Box marginTop={3} data-product-devices>
      <Typography variant="subtitle2" color="textSecondary">
        {t('productDevices.title', { count: devices.length, defaultValue: 'Devices ({{count}})' })}
      </Typography>
      {!devices.length ? (
        <Typography variant="body2" color="textSecondary">
          {t('productDevices.none', 'No device belongs to this product.')}
        </Typography>
      ) : (
        <List dense disablePadding>
          {devices.map(device => (
            <ListItemLocation
              key={device.id}
              to={`/devices/${device.id}`}
              icon="hdd"
              iconColor={device.state === 'active' ? 'primary' : 'grayDark'}
              title={device.name}
              disableGutters
              dense
            />
          ))}
        </List>
      )}
    </Box>
  )
}
