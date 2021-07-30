import React from 'react'
import { getAttributes } from '../helpers/attributes'
import { DataDisplay } from './DataDisplay'
import { Gutters } from './Gutters'

export const ServiceAttributes: React.FC<{ service?: IService; disablePadding?: boolean }> = props => {
  const attributes = getAttributes([
    'serviceLastReported',
    'serviceName',
    'servicePort',
    'serviceProtocol',
    'serviceType',
    'owner',
    'serviceId',
    'sharableLink',
    'license',
  ])

  return (
    <Gutters>
      <DataDisplay {...props} attributes={attributes} />
    </Gutters>
  )
}
