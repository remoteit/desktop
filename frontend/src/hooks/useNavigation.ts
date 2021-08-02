import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { REGEX_FIRST_PATH } from '../shared/constants'
import { useHistory, useLocation } from 'react-router-dom'
import { selectAnnouncements } from '../models/announcements'
import { selectLicenseIndicator } from '../models/licensing'
import { isRemoteUI } from '../helpers/uiHelper'

interface INavigationHook {
  menu: string
  menuItems: INavigation[]
  handleBack: () => void
  handleForward: () => void
}
export function useNavigation(): INavigationHook {
  const history = useHistory()
  const location = useLocation()
  const { ui } = useDispatch<Dispatch>()
  const {
    connections,
    devices,
    navigation,
    remoteUI,
    licenseIndicator,
    unreadAnnouncements,
    navigationBack,
    navigationForward,
  } = useSelector((state: ApplicationState) => ({
    connections: state.connections.all.filter(connection => connection.enabled).length,
    devices: state.devices.total,
    navigation: state.ui.navigation,
    navigationBack: state.ui.navigationBack,
    navigationForward: state.ui.navigationForward,
    licenseIndicator: selectLicenseIndicator(state),
    unreadAnnouncements: selectAnnouncements(state, true).length,
    remoteUI: isRemoteUI(state),
  }))
  const [shouldUpdate, setShouldUpdate] = useState<boolean>(true)

  const match = location.pathname.match(REGEX_FIRST_PATH)
  const menu = match ? match[0] : '/devices'

  // Used for remembering the state of a tab - no longer used
  const recallPath = (selected: string) => {
    const stored = navigation[selected]
    if (!stored || stored === location.pathname) return selected
    else return stored
  }

  useEffect(() => {
    if (navigation[menu] !== location.pathname) {
      ui.set({ navigation: { ...navigation, [menu]: location.pathname } })
    }
  }, [navigation, location, menu])

  useEffect(() => {
    if (
      location?.pathname &&
      location?.pathname !== '/' &&
      shouldUpdate &&
      navigationBack.slice(-1)[0] !== location.pathname
    ) {
      ui.set({ navigationBack: navigationBack.concat([location?.pathname]), navigationForward: [] })
    }
  }, [location?.pathname])

  const handleBack = async () => {
    setShouldUpdate(false)
    const lengthBack = navigationBack?.length
    await history.push(navigationBack[lengthBack - 2])
    ui.set({
      navigationBack: navigationBack.slice(0, lengthBack - 1),
      navigationForward: navigationBack.slice(-1).concat(navigationForward),
    })
    setShouldUpdate(true)
  }

  const handleForward = async () => {
    await history.push(navigationForward[0])
    ui.set({
      navigationForward: navigationForward.slice(1, navigationForward?.length),
    })
  }

  const menuItems: INavigation[] = [
    { label: 'This Device', path: '/devices', match: '/devices/:any?/:any?/:any?', icon: 'hdd', show: remoteUI },
    {
      label: 'Network',
      path: '/connections', // recallPath('/connections')
      match: '/connections/:any?/:any?/:any?',
      icon: 'chart-network',
      show: !remoteUI,
      chip: connections.toLocaleString(),
      chipPrimary: true,
    },
    {
      label: 'Devices',
      path: '/devices',
      match: '/devices',
      icon: 'hdd',
      show: !remoteUI,
      chip: devices.toLocaleString(),
    },
    {
      label: 'Announcements',
      path: '/announcements',
      match: '/announcements',
      icon: 'megaphone',
      badge: unreadAnnouncements,
      show: !remoteUI,
    },
    {
      label: 'More',
      path: '/settings',
      match: '/settings',
      icon: 'ellipsis-h',
      badge: licenseIndicator,
      show: true,
    },
  ]

  return { menu, menuItems, handleBack, handleForward }
}
