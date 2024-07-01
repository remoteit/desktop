import React from 'react'
import { Button, Box } from '@mui/material'

export const RestoreButton: React.FC<{ device: IDevice }> = ({ device }) => {
  return (
    <Box>
      <Button color="primary" variant="contained" size="small">
        RESTORE
      </Button>
    </Box>
  )
}
