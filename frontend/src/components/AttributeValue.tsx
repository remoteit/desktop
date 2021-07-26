import React from 'react'
import { Box } from '@material-ui/core'
import { Attribute } from '../helpers/attributes'

export const AttributeValue: React.FC<{
  attribute?: Attribute
  device: IDevice
  connection?: IConnection
  connections?: IConnection[]
}> = ({ attribute, device, connection, connections }) => {
  const value = attribute?.value({ device, connection, connections }) || ''
  return <Box className={`attribute-${attribute?.id}`}>{value}</Box>
}
