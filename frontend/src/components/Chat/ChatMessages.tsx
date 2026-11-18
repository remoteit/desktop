import React, { useEffect, useRef, useState } from 'react'
import { Box } from '@mui/material'
import { ChatTranscriptMessage } from '../../models/chat'
import { ChatMessageItem } from './ChatMessageItem'
import { ChatMark } from './ChatMark'
import { CHAT_MAX_MESSAGE_WIDTH } from '../../constants'
import { Body } from '../Body'

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

  /* Body owns the scroll element, so the pin check listens on its node instead of
     an onScroll prop. Bound once — the handler only reads live layout. */
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const onScroll = () => setPinned(element.scrollHeight - element.scrollTop - element.clientHeight < 40)
    element.addEventListener('scroll', onScroll)
    return () => element.removeEventListener('scroll', onScroll)
  }, [])

  /* The app's standard scroll surface: Body draws the same top and bottom overflow
     fades the settings and device pages use. They are masked onto the scroll box
     itself, so this wrapper is only here to give the column its flex bounds. */
  return (
    <Box sx={{ display: 'flex', flexGrow: 1, minHeight: 0 }}>
      <Body
        fadeTop
        verticalOverflow
        scrollbarBackground="grayLightest"
        bodyRef={ref}
        sx={{ paddingX: 2.5, paddingY: 1 }}
      >
        {/* The reading measure belongs to the COLUMN, not to each message. Capped per
            message, a wide panel did not widen the text — it pushed the speakers to
            opposite edges and the thread read as two columns. Centred here, the
            conversation holds together at any panel width, and left/right alignment
            stays relative to the column instead of the window. */}
        <Box sx={{ maxWidth: CHAT_MAX_MESSAGE_WIDTH, marginX: 'auto' }}>
          {messages.map((message, index) => (
            <ChatMessageItem key={index} message={message} />
          ))}
          {children}
          {/* Last, and always: one mark anchored to the foot of the conversation. */}
          <ChatMark active={streaming || typing} />
        </Box>
      </Body>
    </Box>
  )
}
