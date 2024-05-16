import React from 'react'
import browser from '../services/browser'

export const PortalUI: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  if (!browser.isPortal) return null
  return <>{children}</>
}
