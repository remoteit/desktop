import { useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { REGEX_FIRST_PATH } from '../shared/constants'
import browser from '../services/Browser'

const getDepth = (path: string) => {
  return path.split('/').filter(Boolean).length
}

const useNavigationListener = () => {
  const history = useHistory()
  const dispatch = useDispatch()
  const customHistory = useSelector((state: ApplicationState) => state.ui.mobileNavigation)

  useEffect(() => {
    if (!browser.isMobile) return

    const unListen = history.listen(location => {
      let newHistory = [...customHistory]
      const menu = location.pathname.match(REGEX_FIRST_PATH)?.[0] || ''
      const currentDepth = getDepth(location.pathname)

      if (menu !== newHistory[0]) {
        // If the menu has changed, reset the history
        newHistory = [menu]
      } else if (currentDepth === 1) {
        // If at the root, replace the last entry
        newHistory = [location.pathname]
      }

      const lastDepth = newHistory.length ? getDepth(newHistory[newHistory.length - 1]) : 0

      if (currentDepth === lastDepth) {
        // Replace the last entry if at the same depth
        newHistory[newHistory.length - 1] = location.pathname
      } else if (currentDepth < lastDepth) {
        // Remove the last entry if going up
        newHistory.pop()
      } else {
        // Otherwise, push a new entry
        newHistory.push(location.pathname)
      }

      if (!newHistory.length) {
        newHistory.push(location.pathname)
      }

      console.log('MOBILE NAVIGATION', newHistory)
      dispatch.ui.set({ mobileNavigation: newHistory })
    })

    return () => {
      unListen()
    }
  }, [dispatch, history, customHistory])
}

export default useNavigationListener
