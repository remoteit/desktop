import React from 'react'
import browser from '../services/browser'

type Props = {
  children?: React.ReactNode
}

export const BillingUI: React.FC<Props> = ({ children }) => {
  return browser.isAndroid ? null : <>{children}</>
}
