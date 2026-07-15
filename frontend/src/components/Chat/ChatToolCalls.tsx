import React, { useState } from 'react'
import { Box, ButtonBase, Collapse, Typography, CircularProgress } from '@mui/material'
import { ChatToolCall } from '../../models/chat'
import { Icon } from '../Icon'

export const ChatToolCalls: React.FC<{ toolCalls: ChatToolCall[] }> = ({ toolCalls }) => {
  const [open, setOpen] = useState(false)
  if (!toolCalls.length) return null
  const running = toolCalls.some(c => c.status === 'running')
  return (
    <Box sx={{ marginY: 0.5 }}>
      <ButtonBase onClick={() => setOpen(!open)} sx={{ borderRadius: 1, paddingX: 0.5, color: 'grayDark.main' }}>
        {running ? (
          <CircularProgress size={12} sx={{ marginRight: 1 }} />
        ) : (
          <Icon name={open ? 'chevron-down' : 'chevron-right'} size="xxs" inlineLeft />
        )}
        <Typography variant="caption">
          Used {toolCalls.length} tool{toolCalls.length === 1 ? '' : 's'}
        </Typography>
      </ButtonBase>
      <Collapse in={open}>
        {toolCalls.map(call => (
          <Box key={call.id} sx={{ paddingLeft: 2, paddingY: 0.5 }}>
            <Typography variant="caption" color={call.status === 'error' ? 'error' : 'grayDarkest.main'}>
              {call.name}
              {call.status === 'running' ? ' …' : ''}
            </Typography>
            {call.result && (
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  color: 'grayDark.main',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {call.result.slice(0, 200)}
              </Typography>
            )}
          </Box>
        ))}
      </Collapse>
    </Box>
  )
}
