import React from 'react'
import { Typography } from '@mui/material'
import { RecountState } from './useRecount'

// What the refresh button is doing, beside it.
export const RecountNote: React.FC<{ state: RecountState; problem?: string }> = ({ state, problem }) => (
  <>
    {state === 'recounting' && (
      <Typography variant="caption" color="primary" data-recounting>
        Recounting…
      </Typography>
    )}
    {state === 'slow' && (
      <Typography variant="caption" color="warning.main" data-recounting-slow>
        Still recounting — the counts update when the walk lands
      </Typography>
    )}
    {problem && (
      <Typography variant="caption" color="error" data-recount-problem>
        {problem}
      </Typography>
    )}
  </>
)
