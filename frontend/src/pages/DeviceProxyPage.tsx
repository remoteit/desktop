import React, { useCallback, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { List, ListSubheader, Typography } from '@mui/material'
import { DeviceContext } from '../services/Context'
import { UNSUPPORTED } from '../services/graphQLDaemon'
import { Proxy, graphQLProxies, graphQLRemoveProxy, graphQLSetProxy } from '../services/graphQLProxy'
import { DeviceHeaderMenu } from '../components/DeviceHeaderMenu'
import { InlineTextFieldSetting } from '../components/InlineTextFieldSetting'
import { ListItemSetting } from '../components/ListItemSetting'
import { LoadingMessage } from '../components/LoadingMessage'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'

/* This device as a proxy (presence-server docs/proxy-plan.md): the people allowed to connect to it may make endpoints
   on it into their services. The device listens only once told to on the device itself (remoteit-device proxy on);
   here its owner names it and says what it takes. Behind the device-sessions flag. */
export const DeviceProxyPage: React.FC = () => {
  const { t } = useTranslation()
  const { device } = useContext(DeviceContext)
  const [proxy, setProxy] = useState<Proxy | null | 'ERROR' | typeof UNSUPPORTED>()
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!device?.id) return
    const list = await graphQLProxies()
    setProxy(Array.isArray(list) ? list.find(p => p.id === device.id) ?? null : list)
  }, [device?.id])

  useEffect(() => {
    setProxy(undefined)
    load()
  }, [load])

  if (!device) return null
  const manage = device.permissions.includes('MANAGE') && !device.shared

  const save = async (set: Parameters<typeof graphQLSetProxy>[1] | 'remove') => {
    setSaving(true)
    const result = set === 'remove' ? await graphQLRemoveProxy(device.id) : await graphQLSetProxy(device.id, set)
    if (result !== 'ERROR') await load()
    setSaving(false)
  }

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
    if (proxy?.kind === 'remoteit')
      return (
        <Notice severity="info" fullWidth>
          {t('deviceProxy.remoteit', "One of remote.it's proxies: {{host}}", { host: proxy.host })}
        </Notice>
      )

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
          <ListItemSetting
            icon="server"
            label={t('deviceProxy.use', 'Use as a proxy')}
            subLabel={
              proxy
                ? t('deviceProxy.usedBy', 'For you and the people who may connect to it')
                : t('deviceProxy.off', 'Make endpoints into services through this device')
            }
            toggle={!!proxy}
            disabled={!manage || saving}
            confirm={!!proxy}
            confirmProps={{
              title: t('deviceProxy.removeConfirm', 'Stop using it as a proxy?'),
              children: t('deviceProxy.removeConfirmBody', 'Every endpoint on it is removed, for everyone using one.'),
            }}
            onClick={() => save(proxy ? 'remove' : {})}
          />
        </List>
        {proxy && (
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
                placeholder={t('deviceProxy.nameNone', 'none: your slug alone')}
                disabled={!manage || saving}
                filter={/[^a-z0-9-]/g}
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
        <Gutters>
          <Typography variant="body2" color="textSecondary">
            {t(
              'deviceProxy.onDevice',
              'The device listens only once told to, on the device itself: run "sudo remoteit-device proxy on" there (it listens on port 443), and "remoteit-device proxy" to see what it serves.'
            )}
          </Typography>
        </Gutters>
      </>
    )
  }

  return (
    <DeviceHeaderMenu>
      <Gutters size={null}>{body()}</Gutters>
    </DeviceHeaderMenu>
  )
}
