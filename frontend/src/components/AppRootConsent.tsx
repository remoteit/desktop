import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Typography } from '@mui/material'
import type { DeviceApp } from '../services/graphQLDeviceApps'
import { AppChange, refused } from '../services/deviceAppsShared'
import type { DeviceApps } from '../hooks/useDeviceApps'
import { capabilityWords } from '../helpers/appsHelper'
import { graphQLCatalogApp } from '../services/graphQLAppCatalog'
import { Confirm } from './Confirm'

/* Asking for the person's yes to a root app's full control, in words naming the app, its publisher and that it gets
   full control of the device (presence-server docs/device-apps-design.md, "Root, shown and consented to"), and what
   else it asks of remote.it — its capabilities, part of the consent (presence-contract docs/self-contained-apps.md,
   "Manifest"). For a product it says the yes covers every device in the product, now and later, as graphql keeps it
   on the product.

   The capabilities named are the release's the yes is given to (release), not the version the device runs: a release
   may ask more than the one before it, and graphql takes the yes as covering what that release asks. They are read
   from its catalogue entry (useReleaseAsks); until they are, the yes waits. */
export const RootConsent: React.FC<{
  app?: { id?: string; name: string; publisher: string; capabilities?: string[] } // open while there is one
  product?: boolean // a product's consent, for every device in it
  action?: string // the confirm button's words, where they are not turning it on
  // A release of an app already on that newly runs as root: the consent moves it there (a re-consent).
  version?: string | null
  // The release the yes is given to, where it is not version: a pin, the release enabling gives. None: the app's own.
  release?: string | null
  accountId?: string // whose catalogue names the release: the device's account
  onConfirm: () => void
  onDeny: () => void
}> = ({ app, product, action, version, release, accountId, onConfirm, onDeny }) => {
  const { t } = useTranslation()
  const words = { app: app?.name, publisher: app?.publisher, version }
  const asks = useReleaseAsks(app, release ?? version, accountId)
  return (
    <Confirm
      open={!!app}
      disabled={asks === undefined}
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
      <AppCapabilities capabilities={asks} />
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

/* What the release a consent is for asks of remote.it (its capabilities): its catalogue entry's for that release; the
   app's own where no release is named, or where the catalogue does not answer for it (an API without one, an error, a
   release it does not list — graphql still refuses a yes that does not cover what the release asks). undefined while
   it is read. */
export function useReleaseAsks(
  app: { id?: string; capabilities?: string[] } | undefined,
  release: string | null | undefined,
  accountId?: string
): string[] | undefined {
  const [read, setRead] = useState<{ key: string; asks: string[] | null }>()
  const key = app?.id && release ? `${accountId ?? ''}/${app.id}/${release}` : ''
  useEffect(() => {
    if (!key || !app?.id || !release) return
    let current = true
    graphQLCatalogApp(app.id, { accountId, releases: 100 }).then(answer => {
      if (!current) return
      const entry = typeof answer === 'object' && answer ? answer.releases.find(r => r.version === release) : undefined
      setRead({ key, asks: entry ? entry.capabilities : null })
    })
    return () => {
      current = false
    }
  }, [key])
  if (!app) return undefined
  if (!key) return app.capabilities ?? []
  if (read?.key !== key) return undefined
  return read.asks ?? app.capabilities ?? []
}

// What an app asks of remote.it beyond running, a line each: in its consent, and where it is offered.
export const AppCapabilities: React.FC<{ capabilities?: string[]; title?: string }> = ({ capabilities, title }) => {
  const { t } = useTranslation()
  if (!capabilities?.length) return null
  return (
    <Box sx={{ marginBottom: 1 }} data-app-capabilities>
      <Typography variant="body2">{title ?? t('apps.capabilitiesAlso', 'It also asks of remote.it:')}</Typography>
      {capabilities.map(capability => (
        <Typography
          key={capability}
          variant="body2"
          component="div"
          sx={{ paddingLeft: 2 }}
          data-app-capability={capability}
        >
          · {capabilityWords(t, capability)}
        </Typography>
      ))}
    </Box>
  )
}

/* Enabling or disabling an app, from wherever it is offered (the device's Apps section, the app's page on the device,
   an app's service's connect panel). A root app is enabled only once the person says yes (RootConsent); that yes is
   consentRoot, which graphql refuses a root app without. Disabling, or a restricted app, at once. A release that newly
   runs as root while the app is enabled (awaitingRoot) is asked for the same way (reconsent): the yes is
   setDeviceAppRelease's consentRoot alone — Update now —, which moves the device to that release. graphql's refusal,
   in its words, goes to onRefused; a change made, to onChanged. */
export function useAppSwitch(
  { turn, setRelease }: Pick<DeviceApps, 'turn'> & Partial<Pick<DeviceApps, 'setRelease'>>,
  onRefused?: (reason: string) => void,
  onChanged?: (app: DeviceApp) => void,
  accountId?: string // the device's account, whose catalogue names the release consented to
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
  // The release the yes goes to: the one waiting for it, else the one enabling gives — its pin, else its channel's.
  const target = updating || asking?.pinned || asking?.latest || asking?.release || asking?.version || null

  const consent = (
    <RootConsent
      app={asking}
      version={updating}
      release={target}
      accountId={accountId}
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
