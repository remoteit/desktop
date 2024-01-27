import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { State, Dispatch } from '../store'
import { REGEX_FIRST_PATH } from '../constants'

const getDepth = (path: string) => {
  return path.split('/').filter(Boolean).length
}

const useMobileNavigation = () => {
  const customHistory = useSelector((state: State) => state.ui.mobileNavigation)
  const dispatch = useDispatch<Dispatch>()
  const { pathname, state } = useLocation<{ isRedirect?: boolean }>()

  const init = () => {
    const currentDepth = getDepth(pathname)
    const menu = pathname.match(REGEX_FIRST_PATH)?.[0] || '/'
    const nextHistory: string[] = []

    if (currentDepth > 1) {
      nextHistory.push(menu)
    }

    nextHistory.push(pathname)
    console.log('MOBILE NAVIGATION init', nextHistory, pathname)
    dispatch.ui.set({ mobileNavigation: nextHistory })
  }

  useEffect(() => {
    if (!customHistory.length) {
      init()
      return
    }

    let nextHistory = [...customHistory]
    const menu = pathname.match(REGEX_FIRST_PATH)?.[0] || '/'
    const currentDepth = getDepth(pathname)

    if (pathname === menu) {
      // if the next location is a root menu, reset the history
      // if (menu !== nextHistory[0]) {
      // If the menu has changed, reset the history
      // @TODO see if we can improve this so it doesn't reset when not navigating to a root menu
      nextHistory = [menu]
    } else if (currentDepth === 1) {
      // If at the root, replace the last entry
      nextHistory = [pathname]
    }

    const lastDepth = nextHistory.length ? getDepth(nextHistory[nextHistory.length - 1]) : 0

    if (state?.isRedirect || currentDepth === lastDepth) {
      // If the last navigation was a redirect, or at the same depth replace the last entry
      nextHistory[nextHistory.length - 1] = pathname
    } else if (currentDepth < lastDepth) {
      // Remove the last entry if going up
      nextHistory.pop()
    } else {
      // Otherwise, push a new entry
      nextHistory.push(pathname)
    }

    if (!nextHistory.length) {
      nextHistory.push(pathname)
    }

    if (state?.isRedirect) console.log('MOBILE NAVIGATION isRedirect')

    dispatch.ui.set({ mobileNavigation: nextHistory })
  }, [dispatch, pathname])
}

export default useMobileNavigation
