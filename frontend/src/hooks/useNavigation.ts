import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { REGEX_FIRST_PATH } from '../shared/constants'
import { useHistory, useLocation } from 'react-router-dom'

interface INavigationHook {
  handleBack: () => void
  handleForward: () => void
}

export function useNavigation(): INavigationHook {
  const history = useHistory()
  const location = useLocation()
  const { ui } = useDispatch<Dispatch>()
  const { navigation, navigationBack, navigationForward } = useSelector((state: ApplicationState) => ({
    navigation: state.ui.navigation,
    navigationBack: state.ui.navigationBack,
    navigationForward: state.ui.navigationForward,
  }))
  const [shouldUpdate, setShouldUpdate] = useState<boolean>(true)
  const [currentUIPayload, setCurrentUIPayload] = useState({})

  const match = location.pathname.match(REGEX_FIRST_PATH)
  const menu = match ? match[0] : '/devices'

  useEffect(() => {
    let newValues: ILookup<any> = {}
    if (
      location?.pathname &&
      location?.pathname !== '/' &&
      shouldUpdate &&
      navigationBack.slice(-1)[0] !== location.pathname
    ) {
      newValues.navigationBack = navigationBack.concat([location?.pathname])
      newValues.navigationForward = []
    }
    if (navigation[menu] !== location.pathname) {
      newValues.navigation = { ...navigation, [menu]: location.pathname }
    }

    if (
      JSON.stringify(newValues) != JSON.stringify(currentUIPayload) &&
      (newValues.navigationBack || newValues.navigation)
    ) {
      setCurrentUIPayload(newValues)
      ui.set({ ...newValues, sidebarMenu: false })
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

  return { handleBack, handleForward }
}
