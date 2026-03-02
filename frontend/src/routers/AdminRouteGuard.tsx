import React from 'react'
import { Redirect } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { State } from '../store'

export const AdminRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const userAdmin = useSelector((state: State) => state.auth.user?.admin || false)
  if (!userAdmin) return <Redirect to="/devices" />
  return <>{children}</>
}
