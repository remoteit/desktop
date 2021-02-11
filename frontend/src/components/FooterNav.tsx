import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { useHistory, useLocation } from 'react-router-dom'
import { REGEX_FIRST_PATH } from '../shared/constants'
import { selectAnnouncements } from '../models/announcements'
import { BottomNavigation, BottomNavigationAction, Badge, Tabs, Tab, Divider, Box } from '@material-ui/core'
import { selectLicenseIndicator } from '../models/licensing'
import { makeStyles } from '@material-ui/core/styles'
import { isRemoteUI } from '../helpers/uiHelper'
import { Icon } from './Icon'
import { colors } from '../styling'

export const FooterNav: React.FC<{ orientation?: 'horizontal' | 'vertical' }> = ({ orientation = 'horizontal' }) => {
  const { remoteUI, licenseIndicator, unreadAnnouncements } = useSelector((state: ApplicationState) => ({
    licenseIndicator: selectLicenseIndicator(state),
    unreadAnnouncements: selectAnnouncements(state, true).length,
    remoteUI: isRemoteUI(state),
  }))

  const css = useStyles()
  const history = useHistory()
  const location = useLocation()
  const [navigation, setNavigation] = useState<{ [menu: string]: string }>({})

  const match = location.pathname.match(REGEX_FIRST_PATH)
  const menu = match ? match[0] : '/'

  const changeNavigation = (_: any, selected: string) => {
    const stored = navigation[selected]
    if (!stored || stored === location.pathname) history.push(selected)
    else history.push(stored)
  }

  useEffect(() => {
    if (navigation[menu] !== location.pathname) {
      setNavigation({ ...navigation, [menu]: location.pathname })
    }
  }, [navigation, location, menu])

  const menuItems = [
    { label: 'This Device', path: '/configure', icon: 'hdd', show: remoteUI },
    { label: 'Connections', path: '/connections', icon: 'scrubber', show: !remoteUI },
    { label: 'Devices', path: '/devices', icon: 'chart-network', show: !remoteUI },
    { label: 'Announcements', path: '/announcements', icon: 'megaphone', badge: unreadAnnouncements, show: !remoteUI },
    { label: 'Settings', path: '/settings', icon: 'cog', badge: licenseIndicator, show: true },
  ]

  return (
    <Tabs className={css.footer} value={menu} onChange={changeNavigation} orientation={orientation}>
      {menuItems.reduce((items: JSX.Element[], m) => {
        if (m.show)
          items.push(
            <Tab
              key={m.path}
              label={m.label}
              value={m.path}
              icon={
                m.badge ? (
                  <Badge variant={m.badge > 1 ? undefined : 'dot'} badgeContent={m.badge} color="error">
                    <Icon name={m.icon} size="lg" />
                  </Badge>
                ) : (
                  <Icon name={m.icon} size="lg" />
                )
              }
            />
          )
        return items
      }, [])}
    </Tabs>
  )
}

const useStyles = makeStyles({
  footer: {
    borderTop: `1px solid ${colors.grayLight}`,
    minHeight: 62,
    justifyContent: 'space-evenly',
    '& .MuiButtonBase-root': { maxWidth: '18%' },
  },
})
