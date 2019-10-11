import React from 'react'
import { DebugLogController } from '../../controllers/DebugLogController'
import { Page } from '../Page'

export function DebugPage() {
  return (
    <Page>
      <h2>Debug Log</h2>
      <DebugLogController />
    </Page>
  )
}
