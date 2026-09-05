import React from 'react'
import browser from '../services/browser'
import { useMobile } from '../hooks/useMobile'

type Props = {
  ios?: boolean
  android?: boolean
  hide?: boolean
  children?: React.ReactNode
}

export const MobileUI: React.FC<Props> = ({ ios, android, hide, children }) => {
  /* The app's own mobile breakpoint rather than a fresh media query on the window.
     Every other breakpoint measures the width left AFTER the docked chat column, so
     asking the raw window made this the one place that could disagree: with the chat
     docked wide the layout goes mobile — bottom menu, single panel, sidebar collapsed —
     while this still served the desktop arrangement. Reading the published value also
     drops a matchMedia subscription per instance, and re-renders only when the boolean
     actually flips.

     `ios`/`android` stay platform questions (which native build am I?), which is a
     different thing from how much room there is. */
  let mobile = useMobile()

  if (android) mobile = mobile && browser.isAndroid
  if (ios) mobile = mobile && browser.isIOS
  if (hide) mobile = !mobile

  return mobile ? <>{children}</> : null
}
