import React from 'react'
import { getAttributes } from './Attributes'
import { DataDisplay } from './DataDisplay'
import { Gutters } from './Gutters'

export const ServiceAttributes: React.FC<{
  device?: IDevice
  service?: IService
  disablePadding?: boolean
}> = props => {
  let attributes = ['license', 'owner', 'serviceLastReported', 'serviceCreated']

  if (props.device?.permissions.includes('MANAGE') || !props.device?.configurable)
    attributes.push('servicePort', 'serviceHost', 'serviceProtocol', 'serviceType')

  attributes.push('presenceAddress', 'serviceId', 'id')

  return (
    <Gutters>
      <DataDisplay {...props} attributes={getAttributes(attributes)} />
    </Gutters>
  )
}
