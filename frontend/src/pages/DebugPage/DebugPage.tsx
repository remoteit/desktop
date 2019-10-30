import React from 'react'
import { DebugLogController } from '../../controllers/DebugLogController'
import { Typography } from '@material-ui/core'
import { Page } from '../Page'

export function DebugPage() {
  return (
    <Page>
      <Typography variant="subtitle1">Debug Log</Typography>
      <DebugLogController />
    </Page>
  )
}
