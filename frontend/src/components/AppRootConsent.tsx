import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Typography } from '@mui/material'
import type { DeviceApp } from '../services/graphQLDeviceApps'
import { AppChange, refused } from '../services/deviceAppsShared'
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

/* Enabling or disabling an app, from wherever it is offered (the device's Apps section, the app's page on the device,
   the console's connect panel). A root app is enabled only once the person says yes (RootConsent); that yes is
   consentRoot, which graphql refuses a root app without. Disabling, or a restricted app, at once. A release that newly
   runs as root while the app is enabled (awaitingRoot) is asked for the same way (reconsent): the yes is
   setDeviceAppRelease's consentRoot alone — Update now —, which moves the device to that release. graphql's refusal,
   in its words, goes to onRefused; a change made, to onChanged. */
export function useAppSwitch(
  { turn, setRelease }: Pick<DeviceApps, 'turn'> & Partial<Pick<DeviceApps, 'setRelease'>>,
  onRefused?: (reason: string) => void,
  onChanged?: (app: DeviceApp) => void
) {
  const { t } = useTranslation()
  const [asking, setAsking] = useState<DeviceApp>()

  const done = (app: DeviceApp) => (answer: AppChange<true>) => {
    if (refused(answer)) onRefused?.(answer.reason)
    else onChanged?.(app)
  }

  const flip = (app: DeviceApp, enabled: boolean) => {
    if (enabled && app.root) setAsking(app)
    else turn(app, enabled).then(done(app))
  }

  const reconsent = (app: DeviceApp) => setAsking(app)
  // An enabled app held back for a release that runs as root: the yes moves it there.
  const waiting = (app?: DeviceApp) => !!app?.enabled && (!!app.awaitingRoot || app.heldBack?.reason === 'consent')
  const updating = waiting(asking) ? asking?.awaitingRoot || asking?.latest || '' : null

  const consent = (
    <RootConsent
      app={asking}
      version={updating}
      action={updating !== null ? t('deviceApps.rootUpdateAction', 'Consent and update') : undefined}
      onConfirm={() => {
        const app = asking
        setAsking(undefined)
        if (!app) return
        if (waiting(app) && setRelease) setRelease(app, { consentRoot: true }).then(done(app))
        else turn(app, true, true).then(done(app))
      }}
      onDeny={() => setAsking(undefined)}
    />
  )

  return { flip, reconsent, consent }
}
