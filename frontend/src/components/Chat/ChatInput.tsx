import React, { useState } from 'react'
import { Box, InputBase } from '@mui/material'
import { IconButton } from '../../buttons/IconButton'

type Props = {
  disabled: boolean
  streaming: boolean
  onSend: (text: string) => void
  onStop: () => void
}

export const ChatInput: React.FC<Props> = ({ disabled, streaming, onSend, onStop }) => {
  const [text, setText] = useState('')
  const submit = () => {
    const trimmed = text.trim()
    if (!trimmed || disabled || streaming) return
    onSend(trimmed)
    setText('')
  }
  return (
    <Box sx={{ padding: 2, paddingTop: 1 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          bgcolor: 'grayLightest.main',
          borderRadius: '14px',
          paddingY: 0.5,
          paddingLeft: 2,
          paddingRight: 0.5,
        }}
      >
        <InputBase
          fullWidth
          multiline
          maxRows={6}
          placeholder={disabled ? 'Waiting for approval…' : ''}
          value={text}
          disabled={disabled}
          sx={{ fontSize: 14, paddingY: 0.75 }}
          onChange={event => setText(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              submit()
            }
          }}
        />
        {streaming ? (
          <IconButton icon="stop" title="Stop" color="grayDark" onClick={onStop} />
        ) : (
          <IconButton
            icon="arrow-turn-down"
            rotate={90}
            title="Send"
            color="grayDark"
            disabled={disabled || !text.trim()}
            hideDisableFade
            onClick={submit}
          />
        )}
      </Box>
    </Box>
  )
}
