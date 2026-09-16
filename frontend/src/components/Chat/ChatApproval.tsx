import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Paper, Typography, Button, Box } from '@mui/material'
import { radius } from '../../styling'

type Props = {
  toolName: string
  input: Record<string, unknown>
  onRespond: (approved: boolean) => void
}

/* Inline card shown when the agent pauses on a write tool awaiting approval */
export const ChatApproval: React.FC<Props> = ({ toolName, input, onRespond }) => {
  const { t } = useTranslation()
  return (
    <Paper elevation={0} sx={{ bgcolor: 'white.main', borderRadius: `${radius.lg}px`, padding: 2, marginY: 1 }}>
      <Typography variant="body2" gutterBottom>
        <Trans
          i18nKey="chat.toolRequest"
          defaults="The agent wants to run <tool>{{tool}}</tool>"
          values={{ tool: toolName }}
          components={{ tool: <b /> }}
        />
      </Typography>
      <Typography
        component="pre"
        variant="caption"
        sx={{ display: 'block', overflowX: 'auto', bgcolor: 'grayLightest.main', borderRadius: `${radius.sm}px`, padding: 1 }}
      >
        {JSON.stringify(input, null, 2)}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, marginTop: 1 }}>
        <Button size="small" variant="contained" onClick={() => onRespond(true)}>
          {t('chat.approve', 'Approve')}
        </Button>
        <Button size="small" onClick={() => onRespond(false)}>
          {t('chat.deny', 'Deny')}
        </Button>
      </Box>
    </Paper>
  )
}
