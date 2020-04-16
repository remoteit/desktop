import React, { useEffect } from 'react'
import { DebugLogController } from '../../controllers/DebugLogController'
import { Typography } from '@material-ui/core'
import { Page } from '../Page'
import Analytics from '../../helpers/Analytics'

export function DebugPage() {
  useEffect(() => {
    Analytics.Instance.page('DebugPage')
  }, [])

  return (
    <Page>
      <Typography variant="h1">Debug Log</Typography>
      <DebugLogController />
    </Page>
  )
}
