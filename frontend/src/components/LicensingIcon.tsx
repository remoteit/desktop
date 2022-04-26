import React from 'react'
import { REMOTEIT_PRODUCT_ID, AWS_PRODUCT_ID } from '../models/plans'
import { Icon } from './Icon'

export const LicensingIcon: React.FC<{ license: ILicense }> = ({ license }) => {
  let type: IconType = 'brands'
  let name: string = ''

  switch (license.id) {
    case AWS_PRODUCT_ID:
      name = 'aws'
      break
    case REMOTEIT_PRODUCT_ID:
    default:
      name = 'r3'
      break
  }

  if (!name) return null

  return <Icon {...{ name, type }} size="md" />
}
