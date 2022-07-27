import React from 'react'
import { isPortal } from '../services/Browser'

export const PortalUI: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  if (!isPortal()) return null
  return <>{children}</>
}
