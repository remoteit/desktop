import React from 'react'
import { LinearProgress as MuiLinearProgress } from '@mui/material'

type Props = { loading?: boolean }

export const LinearProgress: React.FC<Props> = ({ loading }) =>
  loading ? (
    <MuiLinearProgress
      sx={{
        position: 'absolute',
        width: '100%',
        zIndex: 10,
        height: '1px',
        bottom: 0,
        left: 0,
      }}
    />
  ) : null
