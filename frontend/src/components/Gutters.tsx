import React from 'react'
import { spacing, Sizes } from '../styling'
import { Box, BoxProps } from '@mui/material'

export type GuttersProps = Omit<BoxProps, 'inset' | 'size' | 'bottom' | 'top' | 'center'> & {
  inset?: Sizes | 'icon' | null
  size?: Sizes | null
  bottom?: Sizes | null
  top?: Sizes | null
  center?: boolean
  className?: string
  children?: React.ReactNode
}

export const Gutters: React.FC<GuttersProps> = ({
  inset,
  size = 'xl',
  center,
  className,
  bottom = 'md',
  top = 'md',
  children,
  ...props
}) => {
  const { sx, ...rest } = props
  return (
    <Box
      className={className}
      sx={{
        margin: `${top ? spacing[top] : 0}px ${size ? spacing[size] : 0}px ${bottom ? spacing[bottom] : 0}px`,
        paddingLeft: `${inset ? (inset === 'icon' ? 44 : spacing[inset]) : 0}px`,
        textAlign: center ? 'center' : undefined,
        ...sx,
      }}
      {...rest}
    >
      {children}
    </Box>
  )
}
