import React from 'react'
import { DebugLogController } from '../../controllers/DebugLogController'
import { Page } from '../Page'
import { PageHeading } from '../../components/PageHeading'

export function DebugPage() {
  return (
    <Page>
      <PageHeading>Debug Log</PageHeading>
      <DebugLogController />
    </Page>
  )
}
