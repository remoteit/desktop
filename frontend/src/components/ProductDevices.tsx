import React from 'react'
import { useTranslation } from 'react-i18next'
import { Box, List, Typography } from '@mui/material'
import { ProductDevice } from '../services/productPolicy'
import { ListItemLocation } from './ListItemLocation'

/* The devices that belong to a product now (Device.product): those it registered, and those attached to it since —
   the newest, as many as graphql lists at once, and how many there are in all. Each to its own page, where its product
   is changed or detached. */
export const ProductDevices: React.FC<{ devices: ProductDevice[]; count?: number | null }> = ({ devices, count }) => {
  const { t } = useTranslation()
  const total = count ?? devices.length
  return (
    <Box marginTop={3} data-product-devices>
      <Typography variant="subtitle2" color="textSecondary">
        {t('productDevices.title', { count: total, defaultValue: 'Devices ({{count}})' })}
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
          {total > devices.length && (
            <Typography variant="caption" color="textSecondary" data-product-devices-more>
              {t('productDevices.more', { count: total - devices.length, defaultValue: 'and {{count}} more' })}
            </Typography>
          )}
        </List>
      )}
    </Box>
  )
}
