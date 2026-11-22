import React from 'react'
import { Box } from '@mui/material'

type Props = { left?: React.ReactNode; right?: React.ReactNode; tabs?: boolean }

export const ListToolbar: React.FC<Props> = ({ left, right, tabs }) => (
  <Box
    sx={[
      {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1,
        minHeight: 48,
        paddingX: 4.5,
      },
      !!tabs && (theme => ({ paddingX: 0, marginX: 4.5, borderBottom: `1px solid ${theme.palette.grayLighter.main}` })),
    ]}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0, flexGrow: 1, alignSelf: tabs ? 'flex-end' : undefined }}>
      {left}
    </Box>
    {right && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>{right}</Box>}
  </Box>
)
