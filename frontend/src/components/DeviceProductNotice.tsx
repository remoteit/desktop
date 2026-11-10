import React from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Tooltip, Typography } from '@mui/material'
import { useDeviceProduct } from '../hooks/useProductPolicy'
import { DeviceProductRef } from '../services/productPolicy'
import { managedBy, roleName } from '../helpers/productPolicyHelper'
import { Notice } from './Notice'
import { Icon } from './Icon'

// The product holding a device's items: one synced or enforced. Under template its items are the device's own.
export function holdingProduct(product?: DeviceProductRef | null): DeviceProductRef | undefined {
  return product && product.sync !== 'template' ? product : undefined
}

// What a device's page holds from its product (graphql-api docs/PROXY-GROUPS.md §11, wave 4): its tags and services
// locked to it, and, under enforced, nothing of its own added.
export function useProductHold(device?: IDevice) {
  const { state } = useDeviceProduct(device)
  const product = holdingProduct(state?.product)
  return {
    product,
    enforced: product?.sync === 'enforced',
    tags: product ? state?.tags ?? [] : [],
    services: product ? state?.services ?? [] : [],
  }
}

/* A device whose product holds its items, said on its page: under enforced the page is read-only for them — the device
   is exactly the product —, under synced they follow the product and the device may add its own. The networks the
   product makes it a member of are named, as nothing else on the page lists them. */
export const DeviceProductNotice: React.FC<{ device: IDevice }> = ({ device }) => {
  const { t } = useTranslation()
  const { product, enforced } = useProductHold(device)
  if (!product) return null
  const networks = product.networks || []

  return (
    <Box data-device-product={product.sync}>
      <Notice severity={enforced ? 'warning' : 'info'} gutterTop iconOverride={<Icon name="lock" size="md" />}>
        <strong>{managedBy(t, product.name, product.sync)}</strong>
        <Typography variant="caption" component="div">
          {enforced
            ? t(
                'deviceProductNotice.enforced',
                'Its tags, networks and services are the product’s, as are the settings the product sets: they are changed on the product, and nothing else is added here.'
              )
            : t(
                'deviceProductNotice.synced',
                'Its tags, networks and services from the product, and the settings the product sets, are locked and follow the product. It may have its own besides.'
              )}
        </Typography>
        {!!networks.length && (
          <Typography variant="caption" component="div" data-device-product-networks>
            {t('deviceProductNotice.networks', 'Networks from the product: {{networks}}', {
              networks: networks.map(network => `${network.name} (${roleName(t, network.role)})`).join(', '),
            })}
          </Typography>
        )}
      </Notice>
    </Box>
  )
}

// An item a device has from its product, marked with a lock and why.
export const ProductMark: React.FC<{ product: DeviceProductRef }> = ({ product }) => {
  const { t } = useTranslation()
  return (
    <Tooltip title={managedBy(t, product.name, product.sync)} placement="top" arrow>
      <span data-product-mark>
        <Icon name="lock" size="sm" color="grayDark" inlineLeft />
      </span>
    </Tooltip>
  )
}
