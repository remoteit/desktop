import React, { useCallback, useContext, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { getUserAdmin } from '../selectors/state'
import { useTranslation } from 'react-i18next'
import { List, ListSubheader, Typography } from '@mui/material'
import { DeviceContext } from '../services/Context'
import { UNSUPPORTED } from '../services/graphQLDaemon'
import {
  Proxy,
  graphQLProxies,
  graphQLProxyPublicExit,
  graphQLRemoveProxy,
  graphQLRemoveRemoteitProxy,
  graphQLSetProxy,
  graphQLSetProxyPublicExit,
} from '../services/graphQLProxy'
import { DeviceHeaderMenu } from '../components/DeviceHeaderMenu'
import { DeviceExitOffer } from '../components/DeviceExitSection'
import { CONFIGURATION } from '../components/DeviceSettingRow'
import { useDeviceSettings } from '../hooks/useDeviceSettings'
import { InlineTextFieldSetting } from '../components/InlineTextFieldSetting'
import { ListItemSetting } from '../components/ListItemSetting'
import { LoadingMessage } from '../components/LoadingMessage'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { DeviceSetting, settingOn } from '../services/graphQLDeviceSettings'
import { NAME_MAX, splitSubnetName, validLabel } from '../services/subnetNames'
import { useDeviceSessionInfo } from '../hooks/useDeviceSessionInfo'
import type { TFunction } from 'i18next'

/* What this device offers others, in two sections. Proxy (presence-server docs/proxy-plan.md): the people allowed to
   connect to it may make endpoints on it into their services. The device listens only once told to: a device setting
   (proxy), which graphql turns on and off with its being a proxy where the API has device settings — shown here only
   where the device keeps it otherwise — else set on the device itself (remoteit-device proxy on); here its owner names
   it and says what it takes. One of remote.it's public proxies is remote.it's device, made one on the admin page of
   proxies (pages/AdminPublicProxies.tsx), and says so here. Exit: whether
   it offers itself as an exit node (components/DeviceExitSection.tsx) and, for one of remote.it's, whether it is a
   public exit for everyone whose plan gives exits. The exit its own traffic goes out through is chosen on Configure.
   Behind the device-sessions flag. */

// Where the device's listening disagrees with its being a proxy, and why: the machine's administrator, its setting kept
// on the device, or a change made there. None where they agree.
export function proxyListeningLine(t: TFunction, proxy: boolean, listening?: DeviceSetting): string | undefined {
  if (!listening || settingOn(listening) === proxy) return undefined
  if (proxy) {
    if (listening.control === 'off')
      return t('deviceProxy.notListeningAdmin', 'Not listening: turned off on the device by its administrator')
    if (listening.control === 'local')
      return t('deviceProxy.notListeningLocal', 'Not listening: set only on the device, which keeps it off')
    if (!listening.onDevice) return t('deviceProxy.notListening', 'Not listening: its proxy setting is off')
    if (listening.by === CONFIGURATION)
      return t('deviceProxy.notListeningConfiguration', "Not listening: turned off in the device's configuration")
    return listening.by
      ? t('deviceProxy.notListeningBy', 'Not listening: turned off on the device by {{by}}', { by: listening.by })
      : t('deviceProxy.notListeningOnDevice', 'Not listening: turned off on the device')
  }
  if (listening.control === 'on')
    return t(
      'deviceProxy.listeningAdmin',
      'Listening, though not a proxy: turned on on the device by its administrator'
    )
  if (listening.control === 'local')
    return t('deviceProxy.listeningLocal', 'Listening, though not a proxy: set only on the device, which keeps it on')
  if (!listening.onDevice) return t('deviceProxy.listening', 'Listening, though not a proxy: its proxy setting is on')
  if (listening.by === CONFIGURATION)
    return t(
      'deviceProxy.listeningConfiguration',
      "Listening, though not a proxy: turned on in the device's configuration"
    )
  return listening.by
    ? t('deviceProxy.listeningBy', 'Listening, though not a proxy: turned on on the device by {{by}}', {
        by: listening.by,
      })
    : t('deviceProxy.listeningOnDevice', 'Listening, though not a proxy: turned on on the device')
}
// An own proxy's name is a subnet name's: letters and digits, no dash (graphql labelProblem).
export const PROXY_NAME_FILTER = /[^a-z0-9]/g

// What setProxy is given to make the device a proxy: the name typed before, or none for graphql's own, made from the
// device's subnet name.
export const newProxyFields = (name: string) => (name.trim() ? { name: name.trim().toLowerCase() } : {})

// The stage's proxy domain, from the proxies one may use: what follows a proxy host's first label.
export function proxyDomain(proxies: Proxy[]): string | undefined {
  const host = (proxies.find(p => p.kind === 'remoteit') ?? proxies[0])?.host
  return host?.includes('.') ? host.slice(host.indexOf('.') + 1) : undefined
}

// Where a new proxy will be reached: <name>-<slug>.<proxy domain>, the name typed or, for none, the device's subnet
// name, and the slug the device's subnet name's. graphql makes a name unique when that host is taken, so it may differ.
export function proxyHostPreview(subnetName: string | null | undefined, domain: string | undefined, name: string) {
  if (!subnetName || !domain) return undefined
  const { label, rest } = splitSubnetName(subnetName)
  const slug = rest.slice(1).split('.')[0]
  return slug ? `${name.trim().toLowerCase() || label}-${slug}.${domain}` : undefined
}

export const DeviceProxyPage: React.FC = () => {
  const { t } = useTranslation()
  const { device } = useContext(DeviceContext)
  const admin = useSelector(getUserAdmin)
  const [proxy, setProxy] = useState<Proxy | null | 'ERROR' | typeof UNSUPPORTED>()
  const [publicExit, setPublicExit] = useState<boolean>()
  const [saving, setSaving] = useState(false)
  const [newName, setNewName] = useState('')
  const [domain, setDomain] = useState<string>()
  const settings = useDeviceSettings(device?.id)
  const listening = settings.setting('proxy')
  const subnetName = useDeviceSessionInfo(device?.id)?.subnetName

  const load = useCallback(async () => {
    if (!device?.id) return
    const list = await graphQLProxies()
    const found = Array.isArray(list) ? list.find(p => p.id === device.id) ?? null : list
    setProxy(found)
    setDomain(Array.isArray(list) ? proxyDomain(list) : undefined)
    setPublicExit(
      found && typeof found === 'object' && found.kind === 'remoteit'
        ? await graphQLProxyPublicExit(device.id)
        : undefined
    )
  }, [device?.id])

  useEffect(() => {
    setProxy(undefined)
    setNewName('')
    load()
  }, [load])

  if (!device) return null
  const isPublic = typeof proxy === 'object' && proxy?.kind === 'remoteit'
  const manage = device.permissions.includes('MANAGE') && !device.shared

  const run = async (change: () => Promise<unknown>) => {
    setSaving(true)
    if ((await change()) !== 'ERROR') await Promise.all([load(), settings.reload()])
    setSaving(false)
  }
  const save = (set: Parameters<typeof graphQLSetProxy>[1] | 'remove') =>
    run(() => (set === 'remove' ? graphQLRemoveProxy(device.id) : graphQLSetProxy(device.id, set)))

  const body = () => {
    if (proxy === undefined) return <LoadingMessage />
    if (proxy === UNSUPPORTED)
      return (
        <Notice severity="info" fullWidth>
          {t(
            'deviceProxy.unsupported',
            'This API does not serve device sessions. Point Test Settings → API Target at a stage that does (local or dev).'
          )}
        </Notice>
      )
    if (proxy === 'ERROR')
      return (
        <Notice severity="error" fullWidth>
          {t('deviceProxy.error', 'Could not read the proxies.')}
        </Notice>
      )
    const listeningLine = proxyListeningLine(t, !!proxy, listening)
    const preview = proxy ? undefined : proxyHostPreview(subnetName, domain, newName)

    const certificate = !proxy
      ? undefined
      : proxy.certificate === 'own'
      ? t('deviceProxy.certificateOwn', "Your domain's, on the device (proxy_cert, proxy_key)")
      : proxy.certificate === 'ready'
      ? t('deviceProxy.certificateReady', "remote.it's, for its names")
      : t('deviceProxy.certificatePending', "remote.it's, issued within a day of its name: until then https names fail")

    return (
      <>
        <List>
          <ListSubheader>{t('deviceProxy.proxyHeading', 'Proxy')}</ListSubheader>
          <ListItemSetting
            icon="server"
            label={t('deviceProxy.use', 'Use as a proxy')}
            subLabel={
              isPublic
                ? t('deviceProxy.usedByEveryone', 'For everyone')
                : proxy
                ? t('deviceProxy.usedBy', 'For you and the people who may connect to it')
                : t('deviceProxy.off', 'Make endpoints into services through this device')
            }
            toggle={!!proxy}
            disabled={(isPublic ? !admin : !manage) || saving}
            confirm={!!proxy}
            confirmProps={{
              title: t('deviceProxy.removeConfirm', 'Stop using it as a proxy?'),
              children: t('deviceProxy.removeConfirmBody', 'Every endpoint on it is removed, for everyone using one.'),
            }}
            onClick={() =>
              isPublic
                ? run(() => graphQLRemoveRemoteitProxy(device.id))
                : save(proxy ? 'remove' : newProxyFields(newName))
            }
          />
          {!proxy && manage && (
            <>
              <InlineTextFieldSetting
                icon="tag"
                label={t('deviceProxy.newName', 'Its name, before your account slug')}
                value={newName}
                placeholder={t('deviceProxy.nameAutomatic', "none: the device's DNS name")}
                disabled={saving}
                filter={PROXY_NAME_FILTER}
                maxLength={NAME_MAX}
                validate={value =>
                  !value.trim() || validLabel(value)
                    ? undefined
                    : t('deviceProxy.nameProblem', 'Lower case letters and digits, at most {{max}}', { max: NAME_MAX })
                }
                onSave={value => setNewName(String(value).trim().toLowerCase())}
              />
              {preview && (
                <ListItemSetting
                  icon="globe"
                  label={preview}
                  subLabel={t('deviceProxy.hostPreview', 'Where it will be reached, when that name is free')}
                />
              )}
            </>
          )}
          {listeningLine && <ListItemSetting icon="tower-broadcast" iconColor="warning" label={listeningLine} />}
          {isPublic && (
            <ListItemSetting
              icon="globe"
              label={t('deviceProxy.public', 'Public proxy')}
              subLabel={t('deviceProxy.publicOn', "One of remote.it's proxies, for everyone: {{host}}", {
                host: proxy.host,
              })}
            />
          )}
        </List>
        {proxy && !isPublic && (
          <>
            <List>
              <ListSubheader>{t('deviceProxy.names', 'Names')}</ListSubheader>
              <ListItemSetting
                icon="globe"
                label={proxy.host}
                subLabel={t('deviceProxy.host', 'Where it is reached')}
              />
              <InlineTextFieldSetting
                icon="tag"
                label={t('deviceProxy.name', 'Name before your account slug')}
                value={proxy.name || ''}
                placeholder={t('deviceProxy.nameAutomatic', "none: the device's DNS name")}
                disabled={!manage || saving}
                filter={PROXY_NAME_FILTER}
                maxLength={NAME_MAX}
                onSave={value => save({ name: String(value) })}
              />
              <InlineTextFieldSetting
                icon="earth-americas"
                label={t('deviceProxy.domain', 'Your own domain for its https names')}
                value={proxy.domain || ''}
                placeholder="proxy.example.com"
                disabled={!manage || saving}
                onSave={value => save({ domain: String(value) || null })}
              />
              <ListItemSetting
                icon="certificate"
                iconColor={proxy.certificate === 'pending' ? 'warning' : 'success'}
                label={certificate}
                subLabel={t('deviceProxy.certificate', 'Its https certificate')}
              />
            </List>
            <List>
              <ListSubheader>{t('deviceProxy.access', 'Access')}</ListSubheader>
              <ListItemSetting
                icon="users"
                label={t('deviceProxy.publicEndpoints', 'Public endpoints')}
                subLabel={t(
                  'deviceProxy.publicEndpointsHint',
                  'Endpoints anyone with the address may use; off, only signed-in and address-locked ones'
                )}
                toggle={proxy.publicEndpoints}
                disabled={!manage || saving}
                onClick={() => save({ publicEndpoints: !proxy.publicEndpoints })}
              />
            </List>
          </>
        )}
        {!listening && (
          <Gutters>
            <Typography variant="body2" color="textSecondary">
              {t(
                'deviceProxy.onDevice',
                'The device listens only once told to, on the device itself: run "sudo remoteit-device proxy on" there (it listens on port 443), and "remoteit-device proxy" to see what it serves.'
              )}
            </Typography>
          </Gutters>
        )}
      </>
    )
  }

  return (
    <DeviceHeaderMenu>
      <Gutters size={null}>
        {body()}
        {proxy !== UNSUPPORTED && (
          <List>
            <ListSubheader>{t('deviceProxy.exitHeading', 'Exit')}</ListSubheader>
            <DeviceExitOffer device={device} settings={settings} />
            {isPublic && (
              <ListItemSetting
                icon="right-from-bracket"
                label={t('deviceProxy.publicExit', 'Public exit')}
                subLabel={
                  publicExit === undefined
                    ? t('deviceProxy.publicExitUnknown', 'This API cannot say whether it is one')
                    : t(
                        'deviceProxy.publicExitHint',
                        "An exit for everyone whose plan gives exits — remote.it's exit policy applies"
                      )
                }
                toggle={!!publicExit}
                disabled={!admin || saving || publicExit === undefined}
                confirm={!!publicExit}
                confirmProps={{
                  title: t('deviceProxy.publicExitOffConfirm', 'Stop it being a public exit?'),
                  children: t(
                    'deviceProxy.publicExitOffConfirmBody',
                    'Everyone using it as their exit is moved off it.'
                  ),
                }}
                onClick={() => run(() => graphQLSetProxyPublicExit(device.id, !publicExit))}
              />
            )}
          </List>
        )}
      </Gutters>
    </DeviceHeaderMenu>
  )
}
