import React from 'react'
import { Attribute } from './Attributes'
import { spacing } from '../styling'
import { Box } from '@mui/material'

export const AttributeValue: React.FC<IDataOptions & { attribute?: Attribute }> = ({ attribute, ...options }) => {
  const value = attribute?.value({ instance: options.device, ...options }) || ''
  
  if (attribute?.multiline) {
    const lines = value.split('\n')
    return (
      <Box
        className={`attribute attribute-${attribute?.id}`}
        style={{ whiteSpace: 'pre-line' }}
        textAlign={attribute?.align}
        marginRight={attribute?.align === 'right' ? `${spacing.md}px` : undefined}
      >
        {lines.map((line, index) => (
          <React.Fragment key={index}>
            {line}
            {index < lines.length - 1 && <br />}
          </React.Fragment>
        ))}
      </Box>
    )
  }

  return (
    <Box
      className={`attribute attribute-${attribute?.id}`}
      textAlign={attribute?.align}
      marginRight={attribute?.align === 'right' ? `${spacing.md}px` : undefined}
    >
      {value}
    </Box>
  )
}

export const AttributeValueMemo = React.memo(AttributeValue)
