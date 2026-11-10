import React from 'react'
import { useTranslation } from 'react-i18next'
import { ListItemLocation } from './ListItemLocation'
import { ColorChip } from './ColorChip'
import { useProductPolicy } from '../hooks/useProductPolicy'
import { syncLabel } from '../helpers/productPolicyHelper'

// The way to a product's policy from its page, with its sync level: where the API has product policy.
export const ProductPolicyLink: React.FC<{ productId: string }> = ({ productId }) => {
  const { t } = useTranslation()
  const { served, policy } = useProductPolicy(productId)
  if (!served?.product) return null
  return (
    <ListItemLocation
      to={`/products/${productId}/policy`}
      match={`/products/${productId}/policy`}
      icon="arrows-rotate"
      title={t('productPolicyLink.title', 'Policy')}
      dense
    >
      {policy && <ColorChip size="small" label={syncLabel(t, policy.sync)} color="grayDarker" variant="text" />}
    </ListItemLocation>
  )
}
