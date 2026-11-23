import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box,
  Badge,
  BottomNavigation,
  BottomNavigationAction,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import { Dispatch } from '../store'
import { selectLimitsLookup } from '../selectors/organizations'
import { useNavSections } from '../hooks/useNavSections'
import { useCounts } from '../hooks/useCounts'
import { useChatToggle } from '../hooks/useChatEnabled'
import { NavSectionId } from '../helpers/navSections'
import { sectionPanelVariant, setSectionHome } from '../helpers/navVariant'
import { ListItemLocation } from './ListItemLocation'
import { ListItemLink } from './ListItemLink'
import { Icon } from './Icon'

const MORE = 'more'
const TABS: NavSectionId[] = ['thisDevice', 'devices', 'network']

type Props = {
  layout: ILayout
}

export const BottomMenu: React.FC<Props> = ({ layout }) => {
  const { t } = useTranslation()
  const dispatch = useDispatch<Dispatch>()
  const counts = useCounts()
  const limits = useSelector(selectLimitsLookup)
  const nav = useNavSections()
  const chat = useChatToggle()
  const [more, setMore] = useState(false)

  const tabs = nav.sections.filter(section => TABS.includes(section.id))
  const rest = nav.sections.filter(section => !TABS.includes(section.id))
  const value = nav.section && TABS.includes(nav.section.id) ? nav.section.id : MORE

  const select = (id: string) => {
    if (id === MORE) return setMore(true)
    if (chat.show && chat.open) chat.toggle()
    const section = tabs.find(section => section.id === id)
    if (section && id !== value) nav.openSection(section)
    if (section && sectionPanelVariant && section.pages.length > 1) setSectionHome(true)
  }

  return (
    <Box
      sx={{
        borderTop: '1px solid',
        borderColor: layout.mobile ? 'transparent' : 'grayLighter.main',
        paddingBottom: layout.insets.bottom ? layout.insets.bottom + 'px' : 0,
        '& .MuiBadge-badge': { top: -2, right: -10 },
        '& .MuiBottomNavigationAction-label.Mui-selected': { fontSize: '0.75rem' },
      }}
    >
      <BottomNavigation showLabels value={value} onChange={(_, id) => select(id)}>
        {tabs.map(section => (
          <BottomNavigationAction
            key={section.id}
            label={section.label(t)}
            value={section.id}
            icon={<Icon size="md" name={section.icon} />}
          />
        ))}
        <BottomNavigationAction
          label={t('nav.more', 'More')}
          value={MORE}
          icon={
            <Badge variant="dot" color="error" invisible={!counts.unreadAnnouncements}>
              <Icon size="md" name="ellipsis-h" />
            </Badge>
          }
        />
      </BottomNavigation>
      <Drawer
        anchor="bottom"
        open={more}
        onClose={() => setMore(false)}
        PaperProps={{
          sx: { borderTopLeftRadius: 12, borderTopRightRadius: 12, paddingBottom: layout.insets.bottomPx },
        }}
      >
        <List onClick={() => setMore(false)} aria-label={t('nav.more', 'More')}>
          {rest.map(section => (
            <ListItemButton
              key={section.id}
              selected={nav.section?.id === section.id}
              onClick={() => {
                nav.openSection(section)
                if (sectionPanelVariant && section.pages.length > 1) setSectionHome(true)
              }}
            >
              <ListItemIcon>
                <Icon size="md" name={section.icon} fixedWidth />
              </ListItemIcon>
              <ListItemText primary={section.label(t)} />
            </ListItemButton>
          ))}
          {!!rest.length && <Divider sx={{ marginY: 1 }} />}
          <ListItemLocation
            title={t('nav.announcements', 'Announcements')}
            to="/announcements"
            icon="bullhorn"
            badge={counts.unreadAnnouncements}
          />
          {limits.support > 10 ? (
            <ListItemLocation
              title={t('nav.feedback', 'Feedback')}
              onClick={() => dispatch.feedback.reset()}
              to="/feedback"
              icon="message"
            />
          ) : (
            <ListItemLink
              title={t('nav.supportForum', 'Support Forum')}
              href="https://link.remote.it/forum"
              icon="comments"
            />
          )}
          <ListItemLocation title={t('nav.settings', 'Settings')} icon="sliders-h" to="/settings" match="/settings" />
        </List>
      </Drawer>
    </Box>
  )
}
