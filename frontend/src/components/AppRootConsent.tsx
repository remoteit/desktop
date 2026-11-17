import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Typography } from '@mui/material'
import type { DeviceApp } from '../services/graphQLDeviceApps'
import { AppChange, refused } from '../services/deviceAppsShared'
import type { DeviceApps } from '../hooks/useDeviceApps'
import { asksConsent, capabilityWords, ConsentAsking } from '../helpers/appsHelper'
import { graphQLCatalogApp } from '../services/graphQLAppCatalog'
import { Confirm } from './Confirm'

/* Asking for the person's yes to what a release asks (helpers/appsHelper asksConsent, graphql's rule): to run as root —
   full control of the device (presence-server docs/device-apps-design.md, "Root, shown and consented to") — and the
   capabilities it declares (presence-contract docs/self-contained-apps.md, "Manifest"), in words naming the app and its
   publisher. A root release is asked as root, its capabilities beside; a restricted one that declares capabilities is
   asked for those. For a product it says the yes covers every device in the product, now and later, as graphql keeps
   it on the product.

   What is asked is the release's the yes is given to (release), not the version the device runs: a release may ask
   more than the one before it, and graphql takes the yes as covering what that release asks. It is read from its
   catalogue entry, under the account the device or product was read for (useReleaseAsks); until it is, the yes waits.
   action: the confirm button's words, where they are not turning it on, for a release that runs as root or not. */
export const RootConsent: React.FC<{
  // open while there is one; root and capabilities: the app's own, where the catalogue does not name the release
  app?: { id?: string; name: string; publisher: string; root: boolean; capabilities?: string[] }
  product?: boolean // a product's consent, for every device in it
  action?: (root: boolean) => string
  // A release of an app already on that newly asks for consent: the consent moves it there (a re-consent).
  version?: string | null
  // The release the yes is given to, where it is not version: a pin, the release enabling gives. None: the app's own.
  release?: string | null
  accountId: string | undefined // whose catalogue names the release: the device's or the product's account
  onConfirm: () => void
  onDeny: () => void
}> = ({ app, product, action, version, release, accountId, onConfirm, onDeny }) => {
  const { t } = useTranslation()
  const words = { app: app?.name, publisher: app?.publisher, version }
  const asks = useReleaseAsks(app, release ?? version, accountId)
  const root = asks ? asks.root : !!app?.root
  return (
    <Confirm
      open={!!app}
      disabled={asks === undefined}
      color="error"
      title={
        root
          ? product
            ? t('productApps.rootTitle', 'Run {{app}} as root on this product’s devices?', words)
            : t('deviceApps.rootTitle', 'Run {{app}} as root?', words)
          : product
          ? t('productApps.asksTitle', 'Allow {{app}} what it asks on this product’s devices?', words)
          : t('deviceApps.asksTitle', 'Allow {{app}} what it asks?', words)
      }
      action={
        action?.(root) ??
        (root
          ? t('deviceApps.rootAction', 'Turn on with full control')
          : t('deviceApps.asksAction', 'Allow and turn on'))
      }
      onConfirm={onConfirm}
      onDeny={onDeny}
    >
      {version && (
        <Typography variant="body2" gutterBottom data-root-consent-update>
          {root
            ? product
              ? t(
                  'productApps.rootUpdate',
                  '{{app}} {{version}} needs to run as root. Its devices stay on the version they run until you consent.',
                  words
                )
              : t(
                  'deviceApps.rootUpdate',
                  '{{app}} {{version}} needs to run as root. This device stays on the version it runs until you consent.',
                  words
                )
            : product
            ? t(
                'productApps.asksUpdate',
                '{{app}} {{version}} asks more of remote.it. Its devices stay on the version they run until you consent.',
                words
              )
            : t(
                'deviceApps.asksUpdate',
                '{{app}} {{version}} asks more of remote.it. This device stays on the version it runs until you consent.',
                words
              )}
        </Typography>
      )}
      <Typography variant="body2" gutterBottom data-root-consent={root ? 'root' : 'capabilities'}>
        {root
          ? product
            ? t(
                'productApps.rootBody',
                '{{app}}, published by {{publisher}}, runs as root: it gets full control of this device — every file, account and program on it — on every device in this product, now and later.',
                words
              )
            : t(
                'deviceApps.rootBody',
                '{{app}}, published by {{publisher}}, runs as root: it gets full control of this device — every file, account and program on it.',
                words
              )
          : product
          ? t(
              'productApps.asksBody',
              '{{app}}, published by {{publisher}}, runs restricted, with an account of its own on every device in this product, now and later.',
              words
            )
          : t(
              'deviceApps.asksBody',
              '{{app}}, published by {{publisher}}, runs restricted, with an account of its own on this device.',
              words
            )}
      </Typography>
      <AppCapabilities
        capabilities={asks?.capabilities ?? undefined}
        title={root ? undefined : t('apps.capabilitiesAsks', 'It asks of remote.it:')}
      />
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

/* What the release a consent is for asks (whether it runs as root, and its capabilities): its catalogue entry's for
   that release, read under the account the device or product was read for; the app's own where no release is named,
   or where the catalogue does not answer for it (an API without one, an error, a release it does not list — graphql
   still refuses a yes that does not cover what the release asks). undefined while it is read. */
export function useReleaseAsks(
  app: { id?: string; root: boolean; capabilities?: string[] } | undefined,
  release: string | null | undefined,
  accountId: string | undefined
): ConsentAsking | undefined {
  const [read, setRead] = useState<{ key: string; asks: ConsentAsking | null }>()
  const key = app?.id && release ? `${accountId ?? ''}/${app.id}/${release}` : ''
  useEffect(() => {
    if (!key || !app?.id || !release) return
    let current = true
    graphQLCatalogApp(app.id, { accountId, releases: 100 }).then(answer => {
      if (!current) return
      const entry = typeof answer === 'object' && answer ? answer.releases.find(r => r.version === release) : undefined
      setRead({ key, asks: entry ? { root: entry.root, capabilities: entry.capabilities } : null })
    })
    return () => {
      current = false
    }
  }, [key])
  if (!app) return undefined
  const own = { root: app.root, capabilities: app.capabilities ?? [] }
  if (!key) return own
  if (read?.key !== key) return undefined
  return read.asks ?? own
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
   an app's service's connect panel, the device's catalogue). An app is enabled only once the person says yes
   (RootConsent) where graphql asks for one (needsConsent); that yes is consentRoot. Disabling, or an app that asks for
   nothing a consent does not already cover, at once. A release that newly asks while the app is enabled (awaitingRoot)
   is asked for the same way (reconsent): the yes is setDeviceAppRelease's consentRoot alone — Update now —, which moves
   the device to that release. graphql's refusal, in its words, goes to onRefused; a change made, to onChanged. */
export function useAppSwitch(
  { turn, setRelease }: Pick<DeviceApps, 'turn'> & Partial<Pick<DeviceApps, 'setRelease'>>,
  onRefused: ((reason: string) => void) | undefined,
  onChanged: ((app: DeviceApp) => void) | undefined,
  accountId: string | undefined // the device's account, whose catalogue names the release consented to
) {
  const { t } = useTranslation()
  const [asking, setAsking] = useState<DeviceApp>()

  const done = (app: DeviceApp) => (answer: AppChange<true>) => {
    if (refused(answer)) onRefused?.(answer.reason)
    else onChanged?.(app)
  }

  const flip = (app: DeviceApp, enabled: boolean) => {
    if (enabled && needsConsent(app)) setAsking(app)
    else turn(app, enabled).then(done(app))
  }

  const reconsent = (app: DeviceApp) => setAsking(app)
  // An enabled app held back for a release that runs as root: the yes moves it there.
  const waiting = (app?: DeviceApp) => !!app?.enabled && (!!app.awaitingRoot || app.heldBack?.reason === 'consent')
  const updating = waiting(asking) ? asking?.awaitingRoot || asking?.latest || '' : null
  // The release the yes goes to: the one waiting for it, else the one enabling gives — its pin, else its channel's.
  const target =
    updating || asking?.awaitingRoot || asking?.pinned || asking?.latest || asking?.release || asking?.version || null

  const consent = (
    <RootConsent
      app={asking}
      version={updating}
      release={target}
      accountId={accountId}
      action={updating !== null ? () => t('deviceApps.rootUpdateAction', 'Consent and update') : undefined}
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

/* Whether turning an app on asks the person's yes, as graphql decides it: a release waiting for one (awaitingRoot —
   graphql names it, enabled or not, where what its release asks is not covered by the consent kept with it), or, for
   one the device does not have yet (offered: no consent kept), a release that asks for one (asksConsent). */
export const needsConsent = (app: Pick<DeviceApp, 'root' | 'capabilities' | 'awaitingRoot' | 'rootConsent'>) =>
  !!app.awaitingRoot || (asksConsent(app) && !app.rootConsent)
