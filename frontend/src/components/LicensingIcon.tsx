import React from 'react'
import { REMOTEIT_PRODUCT_ID, AWS_PRODUCT_ID, AI_AGENT_PRODUCT_ID } from '../models/plans'
import { Icon } from './Icon'

export const LicensingIcon: React.FC<{ license: ILicense }> = ({ license }) => {
  let type: IconType = 'brands'
  let name: string = ''

  // The add-on's card gets the feature's own mark rather than the remote.it brand mark. Keyed on
  // the product, unlike the switch below, which compares a licence id to product ids and so only
  // ever lands on its default.
  if (license.plan.product.id === AI_AGENT_PRODUCT_ID) return <Icon name="remote-ai" size="lg" />

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

  return <Icon {...{ name, type }} size="lg" />
}
