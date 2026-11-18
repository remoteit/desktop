import React from 'react'
import { AI_AGENT_PRODUCT_ID } from '../models/plans'
import { Icon } from './Icon'

// The add-on's card gets the feature's own mark; everything else the brand mark. (The switch this
// replaced compared a licence id to product ids, so it only ever landed on its default.)
export const LicensingIcon: React.FC<{ license: ILicense }> = ({ license }) =>
  license.plan.product.id === AI_AGENT_PRODUCT_ID ? (
    <Icon name="remote-ai" size="lg" />
  ) : (
    <Icon name="r3" type="brands" size="lg" />
  )
