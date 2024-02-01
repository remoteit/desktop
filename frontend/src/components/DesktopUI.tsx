import React from 'react'
import browser from '../services/Browser'

export const DesktopUI: React.FC<{ hide?: boolean; children?: React.ReactNode }> = ({ hide, children }) => {
  let isDesktop = !browser.hasBackend
  if (hide) isDesktop = !isDesktop
  if (isDesktop) return null
  return <>{children}</>
}
