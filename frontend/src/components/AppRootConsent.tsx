import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Typography } from '@mui/material'
import type { DeviceApp } from '../services/graphQLDeviceApps'
import type { DeviceApps } from '../hooks/useDeviceApps'
import { Confirm } from './Confirm'

/* Turning an app on or off, from wherever it is offered (the device's Apps section, the console's connect panel). A
   root app is turned on only once the person says yes in words naming the app, its publisher and that it gets full
   control of the device; that yes is setDeviceApp's consentRoot, which graphql refuses a root app without (presence-
   server docs/device-apps-design.md, "Root, shown and consented to"). Off, or a restricted app, at once. */
export function useAppSwitch(turn: DeviceApps['turn']) {
  const { t } = useTranslation()
  const [asking, setAsking] = useState<DeviceApp>()

  const flip = (app: DeviceApp, on: boolean) => {
    if (on && app.root) setAsking(app)
    else turn(app, on)
  }

  const consent = (
    <Confirm
      open={!!asking}
      color="error"
      title={t('deviceApps.rootTitle', 'Run {{app}} as root?', { app: asking?.name })}
      action={t('deviceApps.rootAction', 'Turn on with full control')}
      onConfirm={() => {
        const app = asking
        setAsking(undefined)
        if (app) turn(app, true, true)
      }}
      onDeny={() => setAsking(undefined)}
    >
      <Typography variant="body2" gutterBottom data-root-consent>
        {t(
          'deviceApps.rootBody',
          '{{app}}, published by {{publisher}}, runs as root: it gets full control of this device — every file, account and program on it.',
          { app: asking?.name, publisher: asking?.publisher }
        )}
      </Typography>
      <Typography variant="body2">
        {t('deviceApps.rootTrust', 'Turn it on only if you trust {{publisher}} with this device.', {
          publisher: asking?.publisher,
        })}
      </Typography>
    </Confirm>
  )

  return { flip, consent }
}
