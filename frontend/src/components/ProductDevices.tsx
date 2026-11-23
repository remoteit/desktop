import React from 'react'
import { useTranslation } from 'react-i18next'
import { Box, List, Typography } from '@mui/material'
import { ProductDevice } from '../services/productPolicy'
import { ListItemLocation } from './ListItemLocation'
import { Gutters } from './Gutters'
import { LIST_ITEM_ICON_WIDTH, spacing } from '../styling'

/* The devices that belong to a product now (Device.product): those it registered, and those attached to it since —
   the newest, as many as graphql lists at once, and how many there are in all. Each to its own page, where its product
   is changed or detached. */
export const ProductDevices: React.FC<{ devices: ProductDevice[]; count?: number | null }> = ({ devices, count }) => {
  const { t } = useTranslation()
  const total = count ?? devices.length
  return (
    <Box marginTop={2} data-product-devices>
      <Typography variant="subtitle1">
        {t('productDevices.title', { count: total, defaultValue: 'Devices ({{count}})' })}
      </Typography>
      {!devices.length ? (
        <Gutters top={null}>
          <Typography variant="body2" color="textSecondary">
            {t('productDevices.none', 'No device belongs to this product.')}
          </Typography>
        </Gutters>
      ) : (
        <List dense disablePadding>
          {devices.map(device => (
            <ListItemLocation
              key={device.id}
              to={`/devices/${device.id}`}
              icon="hdd"
              iconColor={device.state === 'active' ? 'primary' : 'grayDark'}
              title={device.name}
              dense
            />
          ))}
          {total > devices.length && (
            <Box component="li" sx={{ listStyle: 'none', paddingLeft: `${LIST_ITEM_ICON_WIDTH + spacing.md}px` }}>
              <Typography variant="caption" color="textSecondary" data-product-devices-more>
                {t('productDevices.more', { count: total - devices.length, defaultValue: 'and {{count}} more' })}
              </Typography>
            </Box>
          )}
        </List>
      )}
    </Box>
  )
}
