import React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Box, Button, Typography } from '@mui/material'
import { Dispatch } from '../../store'
import { Icon } from '../Icon'

/* Empty-state introduction: shown before the first message so the panel reads as a chat,
   not a blank column. The example prompts are one tap into a first turn. */
export const ChatIntro: React.FC = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch<Dispatch>()

  const prompts = [
    t('chat.prompt1', 'Which of my devices are offline?'),
    t('chat.prompt2', 'Show my recent connections'),
    t('chat.prompt3', 'Restart a service on one of my devices'),
  ]

  return (
    <Box
      sx={{
        flexGrow: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        paddingX: 3,
        paddingY: 4,
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          bgcolor: 'primaryHighlight.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 2,
        }}
      >
        <Icon name="remote-ai" size="xxl" color="primary" />
      </Box>
      <Typography variant="h3">{t('chat.introTitle', 'Remote.It AI')}</Typography>
      <Typography variant="body2" color="textSecondary" sx={{ maxWidth: 300, marginTop: 1 }}>
        {t(
          'chat.introBody',
          'Ask about your devices, connections, and services — I can look things up and take actions for you.'
        )}
      </Typography>
      <Box sx={{ marginTop: 3, display: 'flex', flexDirection: 'column', gap: 1, width: '100%', maxWidth: 300 }}>
        <Typography variant="caption" color="grayDark.main" sx={{ textAlign: 'left', marginBottom: 0.5 }}>
          {t('chat.tryAsking', 'Try asking')}
        </Typography>
        {prompts.map(prompt => (
          <Button
            key={prompt}
            variant="outlined"
            size="small"
            color="primary"
            onClick={() => dispatch.chat.send(prompt)}
            sx={{ justifyContent: 'flex-start', textTransform: 'none', textAlign: 'left', borderColor: 'grayLighter.main' }}
          >
            {prompt}
          </Button>
        ))}
      </Box>
    </Box>
  )
}
