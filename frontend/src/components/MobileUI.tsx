import React from 'react'
import browser from '../services/browser'
import { useMediaQuery } from '@mui/material'
import { MOBILE_WIDTH } from '../constants'

type Props = {
  ios?: boolean
  android?: boolean
  hide?: boolean
  children?: React.ReactNode
}

export const MobileUI: React.FC<Props> = ({ ios, android, hide, children }) => {
  let mobile = useMediaQuery(`(max-width:${MOBILE_WIDTH}px)`)

  if (android) mobile = mobile && browser.isAndroid
  if (ios) mobile = mobile && browser.isIOS
  if (hide) mobile = !mobile

  return mobile ? <>{children}</> : null
}
