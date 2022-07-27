import React from 'react'
import { Box } from '@mui/material'
import { Attribute } from './Attributes'
import { spacing } from '../styling'

export const AttributeValue: React.FC<{
  attribute?: Attribute
  device: IDevice
  connection?: IConnection
  connections?: IConnection[]
}> = ({ attribute, device, connection, connections }) => {
  const value = attribute?.value({ device, connection, connections }) || ''
  return (
    <Box
      className={`attribute attribute-${attribute?.id}`}
      textAlign={attribute?.align}
      marginRight={attribute?.align === 'right' ? `${spacing.md}px` : undefined}
      whiteSpace={attribute?.multiline ? 'pre-line' : 'nowrap'} // TODO check that preline dosen't need !important
    >
      {value}
    </Box>
  )
}
