import { useEffect, useState } from 'react'
import { SafeArea } from 'capacitor-plugin-safe-area'

type UseSafeAreaResult = {
  insets: ILayout['insets']
  statusBarHeight: number
}

const useSafeArea = (): UseSafeAreaResult => {
  const [insets, setInsets] = useState<ILayout['insets']>({ top: 0, left: 0, bottom: 0, right: 0 })
  const [statusBarHeight, setStatusBarHeight] = useState<number>(0)

  useEffect(() => {
    // Fetch initial safe area insets
    SafeArea.getSafeAreaInsets().then(({ insets }) => {
      setInsets(insets)
    })

    // Fetch initial status bar height
    SafeArea.getStatusBarHeight().then(({ statusBarHeight }) => {
      setStatusBarHeight(statusBarHeight)
    })

    // Listen for changes to the safe area
    const eventListener = SafeArea.addListener('safeAreaChanged', data => {
      setInsets(data.insets)
    })

    return () => {
      // Remove event listener
      eventListener.remove()
    }
  }, [])

  return { insets, statusBarHeight }
}

export default useSafeArea
