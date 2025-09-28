import React from 'react'
import { Attribute } from './Attributes'
import { spacing } from '../styling'
import { Box } from '@mui/material'
import classNames from 'classnames'

export const AttributeValue: React.FC<IDataOptions & { attribute?: Attribute; className?: string }> = ({
  attribute,
  className,
  ...options
}) => {
  const value = attribute?.value({ instance: options.device, ...options }) || ''
  return (
    <Box
      className={classNames(`attribute attribute-${attribute?.id}`, className)}
      style={{ whiteSpace: attribute?.multiline ? 'pre-line' : undefined }}
      textAlign={attribute?.align}
      marginRight={attribute?.align === 'right' ? `${spacing.md}px` : undefined}
    >
      {value}
    </Box>
  )
}

export const AttributeValueMemo = React.memo(AttributeValue)
