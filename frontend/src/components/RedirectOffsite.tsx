import React, { useEffect } from 'react'
import { windowOpen } from '../services/browser'
import { useHistory } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../store'

interface RedirectOffsiteProps {
  to?: string
  children?: React.ReactNode
}

export const RedirectOffsite: React.FC<RedirectOffsiteProps> = ({ to, children }) => {
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()

  useEffect(() => {
    console.log('RedirectOffsite', to)
    if (!to) return
    windowOpen(to, '_blank', true)
    dispatch.ui.set({ noticeMessage: 'You were redirected to your account page on the website.' })
    history.goBack()
  }, [to])

  return to ? null : <>{children}</>
}
