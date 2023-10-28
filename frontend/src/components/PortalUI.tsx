import React from 'react'
import browser from '../services/Browser'

export const PortalUI: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  if (!browser.isPortal) return null
  return <>{children}</>
}
