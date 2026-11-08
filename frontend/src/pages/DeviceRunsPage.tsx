import React, { useCallback, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { useSelector } from 'react-redux'
import { Box, Button, List, ListItem, ListItemIcon, ListItemText, ListSubheader, Typography } from '@mui/material'
import { getUserAdmin } from '../selectors/state'
import { DeviceContext } from '../services/Context'
import { UNSUPPORTED } from '../services/graphQLDaemon'
import { DeviceRuns, graphQLDeviceRuns } from '../services/graphQLDeviceRuns'
import { DeviceSetting, settingOn } from '../services/graphQLDeviceSettings'
import { stillRunsLine } from '../helpers/runsHelper'
import { useDeviceSettings } from '../hooks/useDeviceSettings'
import { CONFIGURATION } from '../components/DeviceSettingRow'
import { DeviceHeaderMenu } from '../components/DeviceHeaderMenu'
import { ProxyAccessList } from '../components/ProxyAccessList'
import { ListItemSetting } from '../components/ListItemSetting'
import { LoadingMessage } from '../components/LoadingMessage'
import { MakeRunDialog } from '../components/MakeRunDialog'
import { RunListItem } from '../components/RunListItem'
import { RunActions } from '../components/RunActions'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Icon } from '../components/Icon'

/* What this device runs (graphql-api docs/PROXY-GROUPS.md §13): at most one exit and one proxy, each with the device's
   state in it — in service, draining, retired, or joining with what it waits for — and a link to it, and the actions on
   it alone, each saying first what it does and after what the device still runs. Its local network is said as its
   machine has it: its exit's setting, changed there (pages/ExitPage.tsx), its machine's administrator keeping the last
   word. One it does not run: "Make this device an exit" (or a proxy), one action of two calls — made, then the device
   added — or the device added to one of its account's own (components/MakeRunDialog.tsx). The device's actions act on
   everything it runs at once, each saying first what it does to each (components/RunActionDialog.tsx). The exit its own
   traffic goes out through is chosen on Configure. A proxy's device listens only once told to (its proxy setting,
   turned on as it joins): where it disagrees, it says why; and who has visited it. Behind the device-sessions flag. */
export const DeviceRunsPage: React.FC = () => {
  const { t } = useTranslation()
  const { device } = useContext(DeviceContext)
  const admin = useSelector(getUserAdmin)
  const [runs, setRuns] = useState<DeviceRuns | null | 'ERROR' | typeof UNSUPPORTED>()
  const [notice, setNotice] = useState<{ severity: 'error' | 'info'; text: string }>()
  const [making, setMaking] = useState<'proxy' | 'exit'>()
  const settings = useDeviceSettings(device?.id)
  const listening = settings.setting('proxy')

  const load = useCallback(async () => {
    if (device?.id) setRuns(await graphQLDeviceRuns(device.id))
  }, [device?.id])

  useEffect(() => {
    setRuns(undefined)
    setNotice(undefined)
    load()
  }, [load])

  if (!device) return null
  const manage = device.permissions.includes('MANAGE') && !device.shared
  const named = { id: device.id, name: device.name }

  // After an action: what the device runs now, said, and its settings read again — a proxy's listening follows it.
  const changed = async (after: DeviceRuns) => {
    setNotice({ severity: 'info', text: stillRunsLine(t, device.name, after) })
    await Promise.all([load(), settings.reload()])
  }

  const body = () => {
    if (runs === undefined) return <LoadingMessage />
    if (runs === UNSUPPORTED)
      return (
        <Notice severity="info" fullWidth>
          {t('deviceRuns.unsupported', 'This server does not have proxies and exits.')}
        </Notice>
      )
    if (runs === 'ERROR')
      return (
        <Notice severity="error" fullWidth>
          {t('deviceRuns.failed', 'What it runs could not be read.')}
        </Notice>
      )
    if (runs === null)
      return (
        <Typography variant="body2" color="textSecondary">
          {t('deviceRuns.notManaged', 'What a device runs is seen by those who manage it.')}
        </Typography>
      )

    const listeningLine = proxyListeningLine(t, !!runs.proxy, listening)
    return (
      <>
        <List data-runs>
          <ListSubheader>{t('deviceRuns.title', 'Runs')}</ListSubheader>
          {runs.exit?.exit ? (
            <RunListItem
              kind="exit"
              run={runs.exit}
              name={runs.exit.exit.name}
              title={t('deviceRuns.exit', 'Exit {{name}}', { name: runs.exit.exit.name })}
              to={runs.exit.exit.remoteit ? (admin ? '/admin/proxies?view=exits' : undefined) : `/exits/${runs.exit.exit.id}`}
              manage={manage}
              lan={!runs.exit.exit.remoteit}
              lanSetOn={runs.exit.exit.remoteit ? undefined : `/exits/${runs.exit.exit.id}`}
              onChanged={changed}
            />
          ) : (
            <NotRunning kind="exit" manage={manage} onMake={() => setMaking('exit')} />
          )}
          {runs.proxy?.proxy ? (
            <RunListItem
              kind="proxy"
              run={runs.proxy}
              name={runs.proxy.proxy.name}
              title={t('deviceRuns.proxy', 'Proxy {{name}}', { name: runs.proxy.proxy.name })}
              to={
                runs.proxy.proxy.remoteit
                  ? admin
                    ? '/admin/proxies?view=proxies'
                    : undefined
                  : `/proxies/${runs.proxy.proxy.id}`
              }
              manage={manage}
              onChanged={changed}
            />
          ) : (
            <NotRunning kind="proxy" manage={manage} onMake={() => setMaking('proxy')} />
          )}
          {listeningLine && <ListItemSetting icon="tower-broadcast" iconColor="warning" label={listeningLine} />}
        </List>
        {manage && (runs.exit || runs.proxy) && (
          <List data-device-actions>
            <ListSubheader>{t('deviceRuns.actions', 'Everything it runs')}</ListSubheader>
            <ListItem>
              <ListItemText
                secondaryTypographyProps={{ component: 'div' }}
                secondary={
                  <>
                    {t(
                      'deviceRuns.actionsHint',
                      'Drain it for maintenance, put it back, retire it, or take it out of everything it runs: each says first what it does to each.'
                    )}
                    <RunActions device={named} scope="device" onDone={changed} />
                  </>
                }
              />
            </ListItem>
          </List>
        )}
        {manage && runs.proxy && (
          <List>
            <ListSubheader>{t('proxyAccess.title', 'Recent visitors')}</ListSubheader>
            <ProxyAccessList scope={{ deviceId: device.id }} showEndpoint />
          </List>
        )}
      </>
    )
  }

  return (
    <DeviceHeaderMenu>
      <Gutters size={null}>
        {notice && (
          <Gutters>
            <Notice severity={notice.severity} fullWidth onClose={() => setNotice(undefined)}>
              {notice.text}
            </Notice>
          </Gutters>
        )}
        <Gutters size={null}>{body()}</Gutters>
      </Gutters>
      {making && device.owner && (
        <MakeRunDialog
          kind={making}
          device={{ ...named, ownerId: device.owner.id }}
          onClose={() => setMaking(undefined)}
          onDone={changed}
        />
      )}
    </DeviceHeaderMenu>
  )
}

// A proxy or an exit the device does not run, and, for whoever manages it, making it one.
const NotRunning: React.FC<{ kind: 'proxy' | 'exit'; manage: boolean; onMake: () => void }> = ({
  kind,
  manage,
  onMake,
}) => {
  const { t } = useTranslation()
  return (
    <ListItem data-not-running={kind}>
      <ListItemIcon>
        <Icon name={kind === 'exit' ? 'door-open' : 'server'} size="md" color="grayDark" />
      </ListItemIcon>
      <ListItemText
        primary={kind === 'exit' ? t('deviceRuns.noExit', 'No exit') : t('deviceRuns.noProxy', 'No proxy')}
        secondaryTypographyProps={{ component: 'div' }}
        secondary={
          <>
            {kind === 'exit'
              ? t('deviceRuns.noExitHint', 'Others could send their traffic out through it')
              : t('deviceRuns.noProxyHint', 'Endpoints into services could be reached through it')}
            {manage && (
              <Box marginTop={0.5}>
                <Button size="small" variant="outlined" data-make={kind} onClick={onMake}>
                  {kind === 'exit'
                    ? t('deviceRuns.makeExit', 'Make this device an exit')
                    : t('deviceRuns.makeProxy', 'Make this device a proxy')}
                </Button>
              </Box>
            )}
          </>
        }
      />
    </ListItem>
  )
}

// Where the device's listening disagrees with its running a proxy, and why: the machine's administrator, its setting
// kept on the device, or a change made there. None where they agree.
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
    return t('deviceProxy.listeningAdmin', 'Listening, though not a proxy: turned on on the device by its administrator')
  if (listening.control === 'local')
    return t('deviceProxy.listeningLocal', 'Listening, though not a proxy: set only on the device, which keeps it on')
  if (!listening.onDevice) return t('deviceProxy.listening', 'Listening, though not a proxy: its proxy setting is on')
  if (listening.by === CONFIGURATION)
    return t('deviceProxy.listeningConfiguration', "Listening, though not a proxy: turned on in the device's configuration")
  return listening.by
    ? t('deviceProxy.listeningBy', 'Listening, though not a proxy: turned on on the device by {{by}}', {
        by: listening.by,
      })
    : t('deviceProxy.listeningOnDevice', 'Listening, though not a proxy: turned on on the device')
}
