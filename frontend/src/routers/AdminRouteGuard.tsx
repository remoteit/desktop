import React from 'react'
import { Redirect } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { State } from '../store'

export const AdminRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const authenticated = useSelector((state: State) => state.auth.authenticated)
  const user = useSelector((state: State) => state.auth.user)

  // auth.authenticated can become true before auth.user is loaded.
  // Avoid redirecting admins during that short hydration window.
  if (authenticated && !user) return null

  const userAdmin = user?.admin || false
  if (!userAdmin) return <Redirect to="/devices" />
  return <>{children}</>
}
