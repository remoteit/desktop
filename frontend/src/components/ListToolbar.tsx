import React from 'react'
import { Box } from '@mui/material'

type Props = { left?: React.ReactNode; right?: React.ReactNode }

export const ListToolbar: React.FC<Props> = ({ left, right }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 1,
      minHeight: 48,
      paddingX: 4.5,
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0, flexGrow: 1 }}>{left}</Box>
    {right && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>{right}</Box>}
  </Box>
)
