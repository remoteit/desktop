import React from 'react'
import { getAttributes } from './Attributes'
import { DataDisplay } from './DataDisplay'
import { Gutters } from './Gutters'

export const ServiceAttributes: React.FC<{
  device?: IDevice
  service?: IService
  disablePadding?: boolean
}> = props => {
  let attributes = [
    'license',
    'owner',
    'serviceLastReported',
    'serviceCreated',
    'servicePort',
    'serviceHost',
    'serviceProtocol',
    'serviceType',
    'presenceAddress',
    'serviceId',
    'id',
  ]
  return (
    <Gutters>
      <DataDisplay {...props} attributes={getAttributes(attributes)} />
    </Gutters>
  )
}
