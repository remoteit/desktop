import React from 'react'
import { serviceAttributes } from './Attributes'
import { DataDisplay } from './DataDisplay'
import { Gutters } from './Gutters'

export const ServiceAttributes: React.FC<{
  device?: IDevice
  service?: IService
  disablePadding?: boolean
}> = props => (
  <Gutters>
    <DataDisplay {...props} attributes={serviceAttributes.filter(a => a.details)} />
  </Gutters>
)

