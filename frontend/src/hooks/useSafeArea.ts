import { useEffect, useState } from 'react'
import { SafeArea } from 'capacitor-plugin-safe-area'
import { spacing } from '../styling'
import browser from '../services/Browser'

type UseSafeAreaResult = {
  insets: ILayout['insets']
  statusBarHeight: number
}

const defaultInsets = { top: 0, left: 0, bottom: 0, right: 0, topPx: '', bottomPx: '', leftPx: '', rightPx: '' }

const useSafeArea = (): UseSafeAreaResult => {
  const [insets, setInsets] = useState<ILayout['insets']>(defaultInsets)
  const [statusBarHeight, setStatusBarHeight] = useState<number>(0)

  useEffect(() => {
    if (!browser.isMobile) return

    const adjustInsets = (insets: Omit<ILayout['insets'], 'topPx' | 'bottomPx' | 'leftPx' | 'rightPx'>) => ({
      ...insets,
      top: insets.top - spacing.sm,
      bottom: insets.bottom - spacing.xs,
      topPx: insets.top - spacing.sm + 'px',
      bottomPx: insets.bottom - spacing.xs + 'px',
      leftPx: insets.left + 'px',
      rightPx: insets.right + 'px',
    })

    SafeArea.addListener('safeAreaChanged', data => {
      console.log('SAFE-AREA CHANGED', data)
      setInsets(adjustInsets(data.insets))
    })

    const fetchInsets = async () => {
      const { insets } = await SafeArea.getSafeAreaInsets()
      const { statusBarHeight } = await SafeArea.getStatusBarHeight()
      setInsets(adjustInsets(insets))
      setStatusBarHeight(statusBarHeight)
    }

    fetchInsets()

    return () => {
      SafeArea.removeAllListeners()
    }
  }, [])

  return { insets, statusBarHeight }
}

export default useSafeArea
