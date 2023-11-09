import React from 'react'
import browser from '../services/Browser'

export const DesktopUI: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  if (!browser.hasBackend) return null
  return <>{children}</>
}
