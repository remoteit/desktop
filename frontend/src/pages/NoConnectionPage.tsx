import React from 'react'
import { Box } from '@mui/material'
import { EmptyMessage } from '../components/EmptyMessage'

export const NoConnectionPage: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', paddingTop: '5vw' }}>
      <EmptyMessage
        message={
          <>
            Select an <br />
            item on the left <br />
            to view its details.
          </>
        }
      />
    </Box>
  )
}

