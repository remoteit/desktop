import { useEffect } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { REGEX_FIRST_PATH } from '../shared/constants'
import browser from '../services/Browser'

const getDepth = (path: string) => {
  return path.split('/').filter(Boolean).length
}

const useNavigationListener = () => {
  const history = useHistory()
  const location = useLocation()
  const dispatch = useDispatch()
  const customHistory = useSelector((state: ApplicationState) => state.ui.mobileNavigation)

  useEffect(() => {
    if (!browser.isMobile) return

    const currentDepth = getDepth(location.pathname)
    const menu = location.pathname.match(REGEX_FIRST_PATH)?.[0] || ''
    const nextHistory: string[] = []

    if (currentDepth > 1) {
      nextHistory.push(menu)
    }

    nextHistory.push(location.pathname)
    dispatch.ui.set({ mobileNavigation: nextHistory })
  }, [])

  useEffect(() => {
    if (!browser.isMobile) return

    const unListen = history.listen(nextLocation => {
      let nextHistory = [...customHistory]
      const menu = nextLocation.pathname.match(REGEX_FIRST_PATH)?.[0] || ''
      const currentDepth = getDepth(nextLocation.pathname)

      if (menu !== nextHistory[0]) {
        // If the menu has changed, reset the history
        nextHistory = [menu]
      } else if (currentDepth === 1) {
        // If at the root, replace the last entry
        nextHistory = [nextLocation.pathname]
      }

      const lastDepth = nextHistory.length ? getDepth(nextHistory[nextHistory.length - 1]) : 0

      if (currentDepth === lastDepth) {
        // Replace the last entry if at the same depth
        nextHistory[nextHistory.length - 1] = nextLocation.pathname
      } else if (currentDepth < lastDepth) {
        // Remove the last entry if going up
        nextHistory.pop()
      } else {
        // Otherwise, push a new entry
        nextHistory.push(nextLocation.pathname)
      }

      if (!nextHistory.length) {
        nextHistory.push(nextLocation.pathname)
      }

      console.log('MOBILE NAVIGATION', nextHistory)
      dispatch.ui.set({ mobileNavigation: nextHistory })
    })

    return () => {
      unListen()
    }
  }, [dispatch, history, customHistory])
}

export default useNavigationListener
