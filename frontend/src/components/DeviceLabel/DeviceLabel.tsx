import React from 'react'
import { Box } from '@mui/material'
import { labelLookup } from '../../models/labels'
import { spacing } from '../../styling'

export const DeviceLabel: React.FC<{ device: IDevice }> = ({ device }) => {
  const label = !!device.attributes?.color ? labelLookup[device.attributes.color] : undefined

  if (!label) return null

  return (
    <Box
      component="span"
      sx={{
        height: '100%',
        width: 8,
        left: 0,
        zIndex: 8,
        position: 'absolute',
        borderTopRightRadius: `${spacing.xxs}px`,
        borderBottomRightRadius: `${spacing.xxs}px`,
      }}
      style={{ backgroundColor: label.color }}
    />
  )
}
