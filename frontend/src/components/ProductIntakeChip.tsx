import React from 'react'
import { useTranslation } from 'react-i18next'
import { ProductOverview, productIntake } from '../helpers/productStatus'
import { ColorChip } from './ColorChip'

export const ProductIntakeChip: React.FC<{ overview: ProductOverview }> = ({ overview }) => {
  const { t } = useTranslation()
  const intake = productIntake(overview)
  const label = {
    accepting: t('productIntake.accepting', 'Accepting'),
    closed: t('productIntake.closed', 'Not accepting'),
    full: t('productIntake.full', 'Full'),
  }[intake]
  return (
    <ColorChip
      size="small"
      label={label}
      color={intake === 'accepting' ? 'success' : intake === 'full' ? 'warning' : 'grayDark'}
      variant="text"
    />
  )
}
