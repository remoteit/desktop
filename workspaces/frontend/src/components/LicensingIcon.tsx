import React from 'react'
import { Icon } from './Icon'

export const LicensingIcon: React.FC<{ license: ILicense }> = ({ license }) => {
  let type: IconType = 'brands'
  let name: string = ''

  switch (license.plan.product.provider) {
    case 'AWS':
      name = 'aws'
      break
    case null:
      name = 'r3'
      break
  }

  if (!name) return null

  return <Icon {...{ name, type }} size="md" />
}
