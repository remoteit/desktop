import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { REGEX_FIRST_PATH } from '../shared/constants'
import { useLocation } from 'react-router-dom'
import { selectAnnouncements } from '../models/announcements'
import { selectLicenseIndicator } from '../models/licensing'
import { isRemoteUI } from '../helpers/uiHelper'

export function useNavigation(): [string, INavigation[]] {
  const location = useLocation()
  const { ui } = useDispatch<Dispatch>()
  const { navigation, remoteUI, licenseIndicator, unreadAnnouncements } = useSelector((state: ApplicationState) => ({
    navigation: state.ui.navigation,
    licenseIndicator: selectLicenseIndicator(state),
    unreadAnnouncements: selectAnnouncements(state, true).length,
    remoteUI: isRemoteUI(state),
  }))

  const match = location.pathname.match(REGEX_FIRST_PATH)
  const menu = match ? match[0] : '/devices'

  const path = (selected: string) => {
    const stored = navigation[selected]
    if (!stored || stored === location.pathname) return selected
    else return stored
  }

  useEffect(() => {
    if (navigation[menu] !== location.pathname) {
      ui.set({ navigation: { ...navigation, [menu]: location.pathname } })
    }
  }, [navigation, location, menu])

  const menuItems: INavigation[] = [
    { label: 'This Device', path: '/devices', match: '/devices', icon: 'hdd', show: remoteUI },
    {
      label: 'Connections',
      path: path('/connections'),
      match: '/connections/:any?/:any?/:any?',
      icon: 'arrow-right',
      show: !remoteUI,
    },
    { label: 'Devices', path: '/devices', match: '/devices', icon: 'chart-network', show: !remoteUI },
    {
      label: 'Announcements',
      path: '/announcements',
      match: '/announcements',
      icon: 'megaphone',
      badge: unreadAnnouncements,
      show: !remoteUI,
    },
    {
      label: 'Settings',
      path: '/settings',
      match: '/settings',
      icon: 'cog',
      badge: licenseIndicator,
      show: true,
    },
  ]

  return [menu, menuItems]
}
