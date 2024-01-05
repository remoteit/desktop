import React, { useEffect } from 'react'
import { windowOpen } from '../services/Browser'
import { useHistory } from 'react-router-dom'

interface RedirectOffsiteProps {
  to?: string
  children?: React.ReactNode
}

export const RedirectOffsite: React.FC<RedirectOffsiteProps> = ({ to, children }) => {
  const history = useHistory()

  useEffect(() => {
    console.log('RedirectOffsite', to)
    if (!to) return
    windowOpen(to, '_blank', true)
    history.goBack()
  }, [to])

  return to ? null : <>{children}</>
}
