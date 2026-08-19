import React from 'react'
import { Gutters, GuttersProps } from './Gutters'
import { useMediaQuery } from '@mui/material'

export const PlanGutters: React.FC<GuttersProps> = ({ children, ...props }) => {
  const small = useMediaQuery(`(max-width:600px)`)

  return (
    <Gutters
      size="lg"
      sx={{
        display: 'flex',
        justifyContent: 'center',
        flexWrap: small ? 'wrap' : 'nowrap',
        marginBottom: 0,
        marginTop: 0,
        maxWidth: 840,
      }}
      {...props}
    >
      {children}
    </Gutters>
  )
}
