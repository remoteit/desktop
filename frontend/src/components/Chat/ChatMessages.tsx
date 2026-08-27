import React, { useEffect, useRef, useState } from 'react'
import { Box } from '@mui/material'
import { ChatTranscriptMessage } from '../../models/chat'
import { ChatMessageItem } from './ChatMessageItem'
import { ChatTyping } from './ChatTyping'
import { scrollbarStyles } from './chatScrollbar'

type Props = {
  messages: ChatTranscriptMessage[]
  streaming: boolean
  typing?: boolean
  children?: React.ReactNode
}

export const ChatMessages: React.FC<Props> = ({ messages, streaming, typing, children }) => {
  const ref = useRef<HTMLDivElement>(null)
  const [pinned, setPinned] = useState(true)

  // Follow the stream, but release when the user scrolls up to read
  useEffect(() => {
    if (pinned) ref.current?.scrollTo({ top: ref.current.scrollHeight })
  }, [messages, streaming, typing, pinned, children])

  return (
    <Box
      ref={ref}
      onScroll={() => {
        const el = ref.current
        if (el) setPinned(el.scrollHeight - el.scrollTop - el.clientHeight < 40)
      }}
      sx={[{ flexGrow: 1, overflowY: 'auto', paddingX: 2.5 }, scrollbarStyles]}
    >
      {messages.map((message, index) => (
        <ChatMessageItem key={index} message={message} />
      ))}
      {typing && <ChatTyping />}
      {children}
    </Box>
  )
}
