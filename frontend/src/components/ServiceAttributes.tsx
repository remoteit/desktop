import React from 'react'
import { useSelector } from 'react-redux'
import { selectAttributeFeatures } from '../selectors/devices'
import { serviceAttributes } from './Attributes'
import { DataDisplay } from './DataDisplay'
import { Gutters } from './Gutters'

export const ServiceAttributes: React.FC<{
  device?: IDevice
  service?: IService
  disablePadding?: boolean
}> = props => {
  // The features that decide which attributes show: the account's, and the device-sessions flag.
  const limits = useSelector(selectAttributeFeatures)
  return (
    <Gutters top="sm" bottom="sm">
      <DataDisplay {...props} limits={limits} attributes={serviceAttributes.filter(a => a.details)} />
    </Gutters>
  )
}
