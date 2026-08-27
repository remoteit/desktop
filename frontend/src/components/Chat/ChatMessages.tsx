import React, { useEffect, useRef, useState } from 'react'
import { Box } from '@mui/material'
import { ChatTranscriptMessage } from '../../models/chat'
import { ChatMessageItem } from './ChatMessageItem'
import { ChatTyping } from './ChatTyping'
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

  /* The app's standard scroll surface: Body draws the bottom overflow fade the
     settings and device pages use. Its fade is absolutely positioned, so it needs
     this relative wrapper to sit at the transcript's bottom edge rather than the
     panel's — otherwise it lands under the composer. */
  return (
    <Box sx={{ position: 'relative', display: 'flex', flexGrow: 1, minHeight: 0 }}>
      <Body verticalOverflow scrollbarBackground="primaryHighlight" bodyRef={ref} sx={{ paddingX: 2.5 }}>
        {messages.map((message, index) => (
          <ChatMessageItem key={index} message={message} />
        ))}
        {typing && <ChatTyping />}
        {children}
      </Body>
    </Box>
  )
}
