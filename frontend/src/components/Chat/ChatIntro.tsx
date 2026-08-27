import React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Box, Chip, Typography } from '@mui/material'
import { Dispatch } from '../../store'
import { Icon } from '../Icon'

/* Empty-state introduction: shown before the first message so the panel reads as a chat,
   not a blank column. The headline floats in the open space; the example prompts sit at
   the BOTTOM, against the composer, because that is where a first turn actually starts —
   they are one tap into the conversation, not decoration under the title. */
export const ChatIntro: React.FC = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch<Dispatch>()

  const prompts = [
    t('chat.prompt1', 'Which of my devices are offline?'),
    t('chat.prompt2', 'Show my recent connections'),
    t('chat.prompt3', 'Restart a service on one of my devices'),
  ]

  return (
    <Box sx={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', paddingX: 2 }}>
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          paddingY: 4,
        }}
      >
        <Icon name="remote-ai" size="xxxl" color="primary" />
        <Typography variant="h3" sx={{ marginTop: 1.5 }}>
          {t('chat.introTitle', 'Remote.It AI')}
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ maxWidth: 280, marginTop: 1 }}>
          {t('chat.introBody', 'Manage your devices, connections, and services \u2014 just ask.')}
        </Typography>
      </Box>
      {/* Left-aligned and content-width so they read as suggestions to pick up,
          rather than full-width buttons competing with the composer below. */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.75, paddingBottom: 1 }}>
        {prompts.map(prompt => (
          <Chip
            key={prompt}
            label={prompt}
            size="small"
            onClick={() => dispatch.chat.send(prompt)}
            sx={{
              bgcolor: 'white.main',
              color: 'grayDarker.main',
              maxWidth: '100%',
              '&:hover': { bgcolor: 'primaryLighter.main' },
            }}
          />
        ))}
      </Box>
    </Box>
  )
}
