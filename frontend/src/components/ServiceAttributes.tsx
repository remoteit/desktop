import React from 'react'
import { getAttributes } from './Attributes'
import { DataDisplay } from './DataDisplay'
import { Gutters } from './Gutters'

export const ServiceAttributes: React.FC<{
  device?: IDevice
  service?: IService
  disablePadding?: boolean
}> = props => {
  const attributes = getAttributes([
    'license',
    'owner',
    'serviceLastReported',
    'serviceCreated',
    // 'serviceName',
    // 'servicePort',
    // 'serviceHost',
    // 'serviceProtocol',
    // 'serviceType',
    'presenceAddress',
    'serviceId',
    'id',
  ])

  return (
    <Gutters>
      <DataDisplay {...props} attributes={attributes} />
    </Gutters>
  )
}
