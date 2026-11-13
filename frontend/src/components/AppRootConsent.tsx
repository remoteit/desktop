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
  // A release of an app already on that newly runs as root: the consent moves it there (a re-consent).
  version?: string | null
  onConfirm: () => void
  onDeny: () => void
}> = ({ app, product, action, version, onConfirm, onDeny }) => {
  const { t } = useTranslation()
  const words = { app: app?.name, publisher: app?.publisher, version }
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
      {version && (
        <Typography variant="body2" gutterBottom data-root-consent-update>
          {product
            ? t(
                'productApps.rootUpdate',
                '{{app}} {{version}} needs to run as root. Its devices stay on the version they run until you consent.',
                words
              )
            : t(
                'deviceApps.rootUpdate',
                '{{app}} {{version}} needs to run as root. This device stays on the version it runs until you consent.',
                words
              )}
        </Typography>
      )}
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
   graphql refuses a root app without. Off, or a restricted app, at once. A release that newly runs as root while the
   app is on (awaitingRoot) is asked for the same way (reconsent): the yes turns it on again with consentRoot, which
   moves the device to that release. */
export function useAppSwitch(turn: DeviceApps['turn']) {
  const { t } = useTranslation()
  const [asking, setAsking] = useState<DeviceApp>()

  const flip = (app: DeviceApp, on: boolean) => {
    if (on && app.root) setAsking(app)
    else turn(app, on)
  }

  const reconsent = (app: DeviceApp) => setAsking(app)
  const updating = asking?.on && asking.awaitingRoot ? asking.awaitingRoot : null

  const consent = (
    <RootConsent
      app={asking}
      version={updating}
      action={updating ? t('deviceApps.rootUpdateAction', 'Consent and update') : undefined}
      onConfirm={() => {
        const app = asking
        setAsking(undefined)
        if (app) turn(app, true, true)
      }}
      onDeny={() => setAsking(undefined)}
    />
  )

  return { flip, reconsent, consent }
}
