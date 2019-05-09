import React from 'react'
import { LoadingMessage } from '../../components/LoadingMessage'
import { Page } from '../Page'

// export interface LoadingPageProps {}

export function LoadingPage() {
  return (
    <Page className="h-100">
      <LoadingMessage message="Loading awesome!" />
    </Page>
  )
}
