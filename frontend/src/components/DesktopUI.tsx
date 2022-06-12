import React from 'react'
import { isPortal } from '../services/Browser'

export const DesktopUI: React.FC = ({ children }) => {
  if (isPortal()) return null
  return <>{children}</>
}
