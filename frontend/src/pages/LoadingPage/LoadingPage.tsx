import React from 'react'
import { LoadingMessage } from '../../components/LoadingMessage'
import { Page } from '../Page'

// export interface LoadingPageProps {}

export function LoadingPage() {
  return (
    <div className="h-100">
      <LoadingMessage message="Signing you in..." />
    </div>
  )
}
