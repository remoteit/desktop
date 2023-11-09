import { useEffect, useState } from 'react'
import { SafeArea } from 'capacitor-plugin-safe-area'
import browser from '../services/Browser'

type UseSafeAreaResult = {
  insets: ILayout['insets']
  statusBarHeight: number
}

const useSafeArea = (): UseSafeAreaResult => {
  const [insets, setInsets] = useState<ILayout['insets']>({ top: 0, left: 0, bottom: 0, right: 0 })
  const [statusBarHeight, setStatusBarHeight] = useState<number>(0)

  useEffect(() => {
    if (!browser.isIOS) return

    const fetchInsets = async () => {
      const { insets } = await SafeArea.getSafeAreaInsets()
      const { statusBarHeight } = await SafeArea.getStatusBarHeight()
      setInsets(insets)
      setStatusBarHeight(statusBarHeight)
    }

    fetchInsets()

    const eventListener = SafeArea.addListener('safeAreaChanged', data => {
      setInsets(data.insets)
    })

    return () => {
      eventListener.remove()
    }
  }, [])

  return { insets, statusBarHeight }
}

export default useSafeArea
