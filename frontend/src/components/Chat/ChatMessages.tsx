import React, { useEffect, useRef, useState } from 'react'
import { Box } from '@mui/material'
import { ChatTranscriptMessage } from '../../models/chat'
import { ChatMessageItem } from './ChatMessageItem'

type Props = {
  messages: ChatTranscriptMessage[]
  streaming: boolean
  children?: React.ReactNode
}

export const ChatMessages: React.FC<Props> = ({ messages, streaming, children }) => {
  const ref = useRef<HTMLDivElement>(null)
  const [pinned, setPinned] = useState(true)

  // Follow the stream, but release when the user scrolls up to read
  useEffect(() => {
    if (pinned) ref.current?.scrollTo({ top: ref.current.scrollHeight })
  }, [messages, streaming, pinned, children])

  return (
    <Box
      ref={ref}
      onScroll={() => {
        const el = ref.current
        if (el) setPinned(el.scrollHeight - el.scrollTop - el.clientHeight < 40)
      }}
      sx={{ flexGrow: 1, overflowY: 'auto', paddingX: 2 }}
    >
      {messages.map((message, index) => (
        <ChatMessageItem key={index} message={message} />
      ))}
      {children}
    </Box>
  )
}
