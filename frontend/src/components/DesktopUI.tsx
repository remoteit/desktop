import React from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'

export const DesktopUI: React.FC = ({ children, ...props }) => {
  const { backendAuthenticated } = useSelector((state: ApplicationState) => state.auth)

  if (!backendAuthenticated) return null

  return <div {...props}>{children}</div>
}
