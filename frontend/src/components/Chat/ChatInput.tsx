import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, InputBase } from '@mui/material'
import { fontSizes, radius } from '../../styling'
import { IconButton } from '../../buttons/IconButton'
import { ChatUsage } from './ChatUsage'

type Props = {
  disabled: boolean
  placeholder?: string
  streaming: boolean
  onSend: (text: string) => void
  onStop: () => void
}

export const ChatInput: React.FC<Props> = ({ disabled, placeholder, streaming, onSend, onStop }) => {
  const { t } = useTranslation()
  const [text, setText] = useState('')
  const submit = () => {
    const trimmed = text.trim()
    if (!trimmed || disabled || streaming) return
    onSend(trimmed)
    setText('')
  }
  return (
    <Box sx={{ paddingX: 2.5, paddingBottom: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box
        sx={{
          flexGrow: 1,
          minWidth: 0,
          display: 'flex',
          alignItems: 'flex-end',
          bgcolor: 'white.main',
          borderRadius: `${radius.lg}px`,
          paddingY: 0.5,
          paddingLeft: 2,
          paddingRight: 0.5,
        }}
      >
        <InputBase
          fullWidth
          multiline
          maxRows={6}
          placeholder={placeholder}
          value={text}
          disabled={disabled}
          sx={{ fontSize: fontSizes.base, paddingY: 0.75 }}
          onChange={event => setText(event.target.value)}
          onKeyDown={event => {
            // isComposing: Enter is confirming an IME candidate (ja/zh/ko),
            // not submitting — sending here would post half-composed text
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault()
              submit()
            }
          }}
        />
        {streaming ? (
          <IconButton icon="stop" title={t('chat.stop', 'Stop')} color="grayDark" onClick={onStop} />
        ) : (
          <IconButton
            icon="arrow-turn-down"
            rotate={90}
            title={t('chat.send', 'Send')}
            color="grayDark"
            disabled={disabled || !text.trim()}
            hideDisableFade
            onClick={submit}
          />
        )}
      </Box>
      <ChatUsage />
    </Box>
  )
}
