import browser from '../services/Browser'
import { PROTOCOL } from '../shared/constants'
import { App, URLOpenListenerEvent } from '@capacitor/app'
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

  async function urlOpen(data: URLOpenListenerEvent) {
    if (!data.url.includes(PROTOCOL)) {
      console.warn('BAD APP URL', data.url)
      return
    }

    const path = data.url.substring(PROTOCOL.length)
    console.log('APP URL OPENED', path)
    history.push(path)
  }
}

export default useCapacitor
