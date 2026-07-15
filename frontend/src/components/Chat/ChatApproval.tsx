import React from 'react'
import { Paper, Typography, Button, Box } from '@mui/material'

type Props = {
  toolName: string
  input: Record<string, unknown>
  onRespond: (approved: boolean) => void
}

/* Inline card shown when the agent pauses on a write tool awaiting approval */
export const ChatApproval: React.FC<Props> = ({ toolName, input, onRespond }) => (
  <Paper elevation={0} sx={{ bgcolor: 'primaryHighlight.main', borderRadius: 2, padding: 2, marginY: 1 }}>
    <Typography variant="body2" gutterBottom>
      The agent wants to run <b>{toolName}</b>
    </Typography>
    <Typography
      component="pre"
      variant="caption"
      sx={{ display: 'block', overflowX: 'auto', bgcolor: 'grayLightest.main', borderRadius: 1, padding: 1 }}
    >
      {JSON.stringify(input, null, 2)}
    </Typography>
    <Box sx={{ display: 'flex', gap: 1, marginTop: 1 }}>
      <Button size="small" variant="contained" onClick={() => onRespond(true)}>
        Approve
      </Button>
      <Button size="small" onClick={() => onRespond(false)}>
        Deny
      </Button>
    </Box>
  </Paper>
)
