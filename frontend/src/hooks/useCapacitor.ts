import browser, { windowClose } from '../services/Browser'
import { PROTOCOL } from '../constants'
import { App, URLOpenListenerEvent } from '@capacitor/app'
import { SplashScreen } from '@capacitor/splash-screen'
import { useHistory } from 'react-router-dom'
import { useEffect } from 'react'

function useCapacitor() {
  const history = useHistory()

  useEffect(() => {
    if (!browser.isMobile) return
    initialize()
    return teardown
  }, [])

  async function initialize() {
    console.log('INITIALIZING CAPACITOR')
    await App.addListener('appUrlOpen', urlOpen)
  }

  function teardown() {
    App.removeAllListeners()
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
      console.log('AUTH CALLBACK', window.origin + path.replace('authCallback', ''))
      location.href = window.origin + path.replace('authCallback', '')
      return
    }

    if (path.includes('signoutCallback')) {
      await windowClose()
      console.log('LOGOUT CALLBACK', path)
      return
    }

    console.log('APP URL OPENED', path)
    history.push(path)
  }

  return hideSplashScreen
}

export default useCapacitor
