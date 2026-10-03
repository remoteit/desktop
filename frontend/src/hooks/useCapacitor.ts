import network from '../services/Network'
import browser, { windowClose } from '../services/browser'
import { PROTOCOL } from '../constants'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'
import { App, URLOpenListenerEvent, AppState } from '@capacitor/app'
import { SplashScreen } from '@capacitor/splash-screen'
import { useHistory } from 'react-router-dom'
import { useEffect } from 'react'

function useCapacitor() {
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()

  useEffect(() => {
    if (!browser.isMobile) return
    initialize()
    return teardown
  }, [])

  async function initialize() {
    console.log('INITIALIZING CAPACITOR')
    await App.addListener('appUrlOpen', urlOpen)
    await App.addListener('appStateChange', handleAppStateChange)
  }

  function teardown() {
    App.removeAllListeners()
  }

  function handleAppStateChange(state: AppState) {
    console.log('APP STATE CHANGE', state)
    if (state.isActive) {
      network.focus()
      setTimeout(() => dispatch.ui.setTheme(undefined), 1000)
      if (state.isActive) dispatch.bluetooth.restartNotifications()
    }
  }

  async function hideSplashScreen() {
    await SplashScreen.hide()
  }

  async function urlOpen(data: URLOpenListenerEvent) {
    if (!data.url.includes(PROTOCOL)) {
      console.warn('BAD APP URL', data.url)
      return
    }

    const path = data.url.substring(PROTOCOL.length)

    if (path.includes('authCallback')) {
      await windowClose()
      SplashScreen.show()
      console.log('AUTH CALLBACK')
      location.href = window.origin + path.replace('authCallback', '')
      return
    }

    if (path.includes('signoutCallback')) {
      await windowClose()
      console.log('LOGOUT CALLBACK', path)
      return
    }

    // Back from the AS's page (an added passkey, a confirmation) or any other deep link: the in-app
    // browser that page ran in closes, and the path is the app's ROUTE — absolute, or the router would
    // resolve `account/security` against wherever the app happens to be.
    console.log('APP URL OPENED', path)
    await windowClose()
    history.push(path.startsWith('/') ? path : `/${path}`)
  }

  return hideSplashScreen
}

export default useCapacitor
