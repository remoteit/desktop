import React from 'react'
import { REGEX_FIRST_PATH } from '../constants'
import { useTranslation } from 'react-i18next'
import { useHistory, useLocation } from 'react-router-dom'
import { Box, BottomNavigation, BottomNavigationAction, Badge } from '@mui/material'
import { useChatToggle } from '../hooks/useChatEnabled'
import { useCounts } from '../hooks/useCounts'
import { ChatAgentGuide } from './Chat/ChatAgentGuide'
import { Icon } from './Icon'

const CHAT = 'chat'

type Props = {
  layout: ILayout
}

export const BottomMenu: React.FC<Props> = ({ layout }) => {
  const location = useLocation()
  const history = useHistory()
  const counts = useCounts()
  const { t } = useTranslation()
  const chat = useChatToggle()

  const menu = location.pathname.match(REGEX_FIRST_PATH)?.[0] || '/devices'
  const chatTab = chat.show && chat.open

  const select = (value: string) => {
    if (value === CHAT) {
      if (!chatTab) chat.toggle()
      return
    }
    if (chatTab) chat.toggle()
    if (value !== menu) history.push(value)
  }

  return (
    <Box
      sx={{
        borderTop: '1px solid',
        borderColor: layout.mobile ? 'transparent' : 'grayLighter.main',
        paddingBottom: layout.insets.bottom ? layout.insets.bottom + 'px' : 0,
        '& .MuiBadge-badge': {
          top: -2,
          right: -10,
        },
      }}
    >
      <BottomNavigation value={chatTab ? CHAT : menu} onChange={(_, value) => select(value)}>
        {chat.show && (
          <BottomNavigationAction
            label={t('nav.agent', 'Agent')}
            icon={
              <ChatAgentGuide placement="top">
                <Icon size="lg" name="remote-ai" />
              </ChatAgentGuide>
            }
            value={CHAT}
          />
        )}
        <BottomNavigationAction
          label={t('nav.connections', 'Connections')}
          icon={
            <Badge badgeContent={counts.active} color="primary">
              <Icon size="md" name="arrow-right-arrow-left" />
            </Badge>
          }
          value="/connections"
        />
        <BottomNavigationAction label={t('nav.devices', 'Devices')} icon={<Icon size="md" name="router" />} value="/devices" />
        <BottomNavigationAction label={t('nav.networks', 'Networks')} icon={<Icon size="md" name="chart-network" />} value="/networks" />
      </BottomNavigation>
    </Box>
  )
}
