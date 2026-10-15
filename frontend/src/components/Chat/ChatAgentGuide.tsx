import React from 'react'
import { useTranslation } from 'react-i18next'
import { Typography, TooltipProps } from '@mui/material'
import { CHAT_GUIDE_DATE } from '../../constants'
import { GuideBubble } from '../GuideBubble'

type Props = {
  placement: TooltipProps['placement']
  children: React.ReactNode
}

/* Step 1 of the chat tour, wrapped around whichever button opens the chat. Deliberately no
   startDate — this is new to everyone, including long-standing accounts, so the usual "only
   for recent signups" cohort gate would hide it from the people who most need it. The delay
   lets the app settle before it speaks up. */
export const ChatAgentGuide: React.FC<Props> = ({ placement, children }) => {
  const { t } = useTranslation()
  return (
    <GuideBubble
      guide="chatAgent"
      added={CHAT_GUIDE_DATE}
      placement={placement}
      enterDelay={1200}
      instructions={
        <>
          <Typography variant="h3" gutterBottom>
            <b>{t('chat.guideAgentTitle', 'Meet Remote.It AI')}</b>
          </Typography>
          <Typography variant="body2" gutterBottom>
            {t(
              'chat.guideAgentBody',
              'Ask about your devices, connections and services — or tell it to make changes. Open and close it here any time.'
            )}
          </Typography>
        </>
      }
    >
      {children}
    </GuideBubble>
  )
}
