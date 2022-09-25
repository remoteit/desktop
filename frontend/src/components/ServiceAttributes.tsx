import React from 'react'
import { getAttributes } from './Attributes'
import { DataDisplay } from './DataDisplay'
import { Gutters } from './Gutters'

export const ServiceAttributes: React.FC<{ service?: IService; disablePadding?: boolean }> = props => {
  const attributes = getAttributes([
    'serviceLastReported',
    'serviceCreated',
    'serviceName',
    'servicePort',
    'serviceHost',
    'serviceProtocol',
    'serviceType',
    'owner',
    'serviceId',
    'license',
  ])

  return (
    <Gutters>
      <DataDisplay {...props} attributes={attributes} />
    </Gutters>
  )
}
