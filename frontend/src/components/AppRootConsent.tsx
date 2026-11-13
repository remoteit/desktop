import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Typography } from '@mui/material'
import type { DeviceApp } from '../services/graphQLDeviceApps'
import type { DeviceApps } from '../hooks/useDeviceApps'
import { Confirm } from './Confirm'

/* Asking for the person's yes to a root app's full control, in words naming the app, its publisher and that it gets
   full control of the device (presence-server docs/device-apps-design.md, "Root, shown and consented to"). For a
   product it says the yes covers every device in the product, now and later, as graphql keeps it on the product. */
export const RootConsent: React.FC<{
  app?: { name: string; publisher: string } // open while there is one
  product?: boolean // a product's consent, for every device in it
  action?: string // the confirm button's words, where they are not turning it on
  onConfirm: () => void
  onDeny: () => void
}> = ({ app, product, action, onConfirm, onDeny }) => {
  const { t } = useTranslation()
  const words = { app: app?.name, publisher: app?.publisher }
  return (
    <Confirm
      open={!!app}
      color="error"
      title={
        product
          ? t('productApps.rootTitle', 'Run {{app}} as root on this product’s devices?', words)
          : t('deviceApps.rootTitle', 'Run {{app}} as root?', words)
      }
      action={action ?? t('deviceApps.rootAction', 'Turn on with full control')}
      onConfirm={onConfirm}
      onDeny={onDeny}
    >
      <Typography variant="body2" gutterBottom data-root-consent>
        {product
          ? t(
              'productApps.rootBody',
              '{{app}}, published by {{publisher}}, runs as root: it gets full control of this device — every file, account and program on it — on every device in this product, now and later.',
              words
            )
          : t(
              'deviceApps.rootBody',
              '{{app}}, published by {{publisher}}, runs as root: it gets full control of this device — every file, account and program on it.',
              words
            )}
      </Typography>
      <Typography variant="body2">
        {product
          ? t(
              'productApps.rootTrust',
              'Turn it on only if you trust {{publisher}} with every device in this product.',
              words
            )
          : t('deviceApps.rootTrust', 'Turn it on only if you trust {{publisher}} with this device.', words)}
      </Typography>
    </Confirm>
  )
}

/* Turning an app on or off, from wherever it is offered (the device's Apps section, the console's connect panel). A
   root app is turned on only once the person says yes (RootConsent); that yes is setDeviceApp's consentRoot, which
   graphql refuses a root app without. Off, or a restricted app, at once. */
export function useAppSwitch(turn: DeviceApps['turn']) {
  const [asking, setAsking] = useState<DeviceApp>()

  const flip = (app: DeviceApp, on: boolean) => {
    if (on && app.root) setAsking(app)
    else turn(app, on)
  }

  const consent = (
    <RootConsent
      app={asking}
      onConfirm={() => {
        const app = asking
        setAsking(undefined)
        if (app) turn(app, true, true)
      }}
      onDeny={() => setAsking(undefined)}
    />
  )

  return { flip, consent }
}
