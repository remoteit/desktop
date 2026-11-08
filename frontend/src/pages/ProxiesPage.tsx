import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { List, ListItem, ListItemIcon, ListItemText, ListSubheader, Typography } from '@mui/material'
import { UNSUPPORTED } from '../services/graphQLDaemon'
import { Proxy, graphQLProxies } from '../services/graphQLProxy'
import { endpointsLine, outOfService, runsOnLine } from '../helpers/runsHelper'
import { useAccountProxies } from '../hooks/useAccountExits'
import { useDisabledDevicesAccess } from '../hooks/useDeviceDisable'
import { ListItemLocation } from '../components/ListItemLocation'
import { LoadingMessage } from '../components/LoadingMessage'
import { IconButton } from '../buttons/IconButton'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { Icon } from '../components/Icon'

type Choice = Exclude<Awaited<ReturnType<typeof graphQLProxies>>, 'ERROR' | typeof UNSUPPORTED>[number]

/* Proxies (graphql-api docs/PROXY-GROUPS.md §13 and §14): where endpoints into device services are reached, run by
   devices. The account's own — each with its host, the devices it runs on, its endpoints and its certificate, and
   marked where it is reached on its devices' own network only — open on their page (pages/ProxyPage.tsx); remote.it's,
   which anyone may make endpoints on, are listed. New proxy makes one, then its devices are added
   (pages/ProxyAddPage.tsx). Behind the device-sessions flag. */
export const ProxiesPage: React.FC = () => {
  const { t } = useTranslation()
  const manage = useDisabledDevicesAccess()
  const { value: proxies } = useAccountProxies()
  const [remoteit, setRemoteit] = useState<Choice[]>([])

  useEffect(() => {
    graphQLProxies().then(list => setRemoteit(Array.isArray(list) ? list.filter(proxy => proxy.remoteit) : []))
  }, [])

  return (
    <Container
      gutterBottom
      bodyProps={{ verticalOverflow: true }}
      header={
        <>
          <Typography variant="subtitle1">
            <Title>{t('proxiesPage.title', 'Proxies')}</Title>
            {manage && (
              <IconButton icon="plus" title={t('proxiesPage.new', 'New proxy')} to="/proxies/new" size="md" />
            )}
          </Typography>
          <Gutters top={null} bottom="sm">
            <Typography variant="body2" color="textSecondary">
              {t(
                'proxiesPage.description',
                'A proxy gives a service an address anyone you choose can reach — from the internet, or on its devices’ own network only: a name for https, a port for tcp and udp. A proxy runs on devices: make one, then add the devices that run it.'
              )}
            </Typography>
          </Gutters>
        </>
      }
    >
      {proxies === undefined ? (
        <LoadingMessage />
      ) : proxies === UNSUPPORTED ? (
        <Notice gutterTop>{t('proxiesPage.unsupported', 'This server does not have proxies.')}</Notice>
      ) : proxies === 'ERROR' ? (
        <Notice severity="error" gutterTop>
          {t('proxiesPage.failed', 'The proxies could not be read.')}
        </Notice>
      ) : (
        <>
          <List>
            <ListSubheader>{t('proxiesPage.own', 'Yours')}</ListSubheader>
            {proxies.map(proxy => (
              <ListItemLocation
                key={proxy.id}
                data-proxy={proxy.id}
                to={`/proxies/${proxy.id}`}
                match={`/proxies/${proxy.id}`}
                icon={<Icon name="server" size="md" color={serving(proxy) ? 'primary' : 'grayDark'} fixedWidth />}
                title={
                  <>
                    {proxy.name}
                    {proxy.local && (
                      <Typography component="span" variant="caption" color="textSecondary" marginLeft={1} data-local>
                        {t('proxies.local', 'Local network')}
                      </Typography>
                    )}
                  </>
                }
                subtitle={proxyLine(t, proxy)}
              />
            ))}
            {!proxies.length && (
              <ListItem>
                <ListItemText
                  secondary={t('proxiesPage.none', 'None yet: make a proxy, then add the devices that run it.')}
                />
              </ListItem>
            )}
          </List>
          {!!remoteit.length && (
            <List>
              <ListSubheader>{t('proxiesPage.remoteit', 'remote.it’s')}</ListSubheader>
              {remoteit.map(proxy => (
                <ListItem key={proxy.id} data-remoteit={proxy.id}>
                  <ListItemIcon>
                    <Icon name="globe" size="md" fixedWidth />
                  </ListItemIcon>
                  <ListItemText primary={proxy.name} secondary={[proxy.host, proxy.provider].filter(Boolean).join(' · ')} />
                </ListItem>
              ))}
            </List>
          )}
        </>
      )}
    </Container>
  )
}

// Whether any of its devices is in service: not joining or disabled, and not out of it — failing a check, or not
// reachable from the internet.
export const serving = (proxy: Pick<Proxy, 'devices'>) =>
  !!proxy.devices?.some(
    device => device.state === 'ACTIVE' && !device.joining && !device.disabled && !outOfService(device)
  )

// One of yours, in a line: its host, the devices it runs on, its endpoints, and a certificate still to come.
export function proxyLine(t: TFunction, proxy: Proxy): string {
  return [
    proxy.host,
    runsOnLine(t, proxy.devices),
    endpointsLine(t, proxy.endpointCount),
    proxy.certificate === 'pending' ? t('proxiesPage.certificatePending', 'Certificate pending') : '',
  ]
    .filter(Boolean)
    .join(' · ')
}
