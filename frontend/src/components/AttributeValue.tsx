import React from 'react'
import { Attribute } from './Attributes'
import { spacing } from '../styling'
import { Box } from '@mui/material'

export const AttributeValue: React.FC<{
  device?: IDevice
  attribute?: Attribute
  connection?: IConnection
  connections?: IConnection[]
}> = ({ device, attribute, connection, connections }) => {
  const value = attribute?.value({ device, instance: device, connection, connections }) || ''
  return (
    <Box
      className={`attribute attribute-${attribute?.id}`}
      style={{ whiteSpace: attribute?.multiline ? 'pre-line' : undefined }}
      textAlign={attribute?.align}
      marginRight={attribute?.align === 'right' ? `${spacing.md}px` : undefined}
    >
      {value}
    </Box>
  )
}

export const AttributeValueMemo = React.memo(AttributeValue)
