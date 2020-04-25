import React, { useEffect } from 'react'
import { DebugLogController } from '../../controllers/DebugLogController'
import { Typography } from '@material-ui/core'
import { Page } from '../Page'
import analytics from '../../helpers/Analytics'
import { emit } from '../../services/Controller'

export function DebugPage() {
  useEffect(() => {
    analytics.page('DebugPage')
    emit('interfaces')
  }, [])

  return (
    <Page>
      <Typography variant="h1">Debug Log</Typography>
      <DebugLogController />
    </Page>
  )
}
