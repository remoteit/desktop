import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { List, ListSubheader, Typography } from '@mui/material'
import { UNSUPPORTED } from '../services/graphQLDaemon'
import { AccountProxyBase, ListedProxy, ProxyChoice, ProxyOwnNameBrief, graphQLProxies } from '../services/graphQLProxy'
import { outOfService } from '../helpers/runsHelper'
import { proxySummary } from '../helpers/exitWords'
import { useAccountProxies, useAccountProxyBase } from '../hooks/useAccountExits'
import { useDisabledDevicesAccess } from '../hooks/useDeviceDisable'
import { useAccountAdmin } from '../hooks/useAccountAdmin'
import { baseStateLine } from '../helpers/proxyBaseHelper'
import { ListItemLocation } from '../components/ListItemLocation'
import { LoadingMessage } from '../components/LoadingMessage'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { NetworkSectionIntro } from '../components/NetworkSectionIntro'
import { Icon } from '../components/Icon'

/* Proxy servers: your own first, each saying whether it is ready and where it runs; Remote.It's, labelled; and last,
   for an admin of the account, the paid add-on that names public addresses under your own domain. */
export const ProxiesPage: React.FC = () => {
  const { t } = useTranslation()
  const manage = useDisabledDevicesAccess()
  const admin = useAccountAdmin()
  const { value: proxies } = useAccountProxies()
  const [remoteit, setRemoteit] = useState<ProxyChoice[]>([])

  useEffect(() => {
    graphQLProxies().then(list => setRemoteit(Array.isArray(list) ? list.filter(proxy => proxy.remoteit) : []))
  }, [])

  return (
    <Container
      gutterBottom
      bodyProps={{ verticalOverflow: true }}
      header={
        <NetworkSectionIntro
          intro={t(
            'proxiesPage.intro',
            'Run public addresses for your services on your own devices. Remote.It’s proxy servers are always there too.'
          )}
          action={manage ? t('proxiesPage.create', 'Create proxy server') : undefined}
          to="/proxies/new"
        />
      }
    >
      {proxies === undefined ? (
        <LoadingMessage />
      ) : proxies === UNSUPPORTED ? (
        <Notice gutterTop>{t('proxiesPage.unsupported', 'Proxy servers aren’t available on this server.')}</Notice>
      ) : proxies === 'ERROR' ? (
        <Notice severity="error" gutterTop>
          {t('proxiesPage.failed', 'Couldn’t load your proxy servers. Try again.')}
        </Notice>
      ) : (
        <>
          <List>
            <ListSubheader>{t('proxiesPage.own', 'Your proxy servers')}</ListSubheader>
            {proxies.map(proxy => (
              <ListItemLocation
                key={proxy.id}
                data-proxy={proxy.id}
                to={`/proxies/${proxy.id}`}
                match={`/proxies/${proxy.id}`}
                sx={{ '& .MuiListItemText-secondary': { overflowWrap: 'anywhere' } }}
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
              <Gutters top="xs" bottom="sm">
                <Typography variant="body2" color="textSecondary" data-empty>
                  {t(
                    'proxiesPage.none',
                    'No proxy servers yet. Your public addresses use Remote.It’s until you create one.'
                  )}
                </Typography>
              </Gutters>
            )}
          </List>
          {!!remoteit.length && (
            <List>
              <ListSubheader>{t('proxiesPage.remoteit', 'Remote.It proxy servers')}</ListSubheader>
              {remoteit.map(proxy => (
                <ListItemLocation
                  key={proxy.id}
                  data-remoteit={proxy.id}
                  to={`/proxies/${proxy.id}`}
                  match={`/proxies/${proxy.id}`}
                  icon={<Icon name="globe" size="md" fixedWidth />}
                  title={proxy.name}
                  subtitle={[proxy.location || proxy.provider, t('exitsPage.runByRemoteit', 'Run by Remote.It')]
                    .filter(Boolean)
                    .join(' · ')}
                />
              ))}
            </List>
          )}
          {admin && <AccountBaseEntry />}
        </>
      )}
    </Container>
  )
}

const AccountBaseEntry: React.FC = () => {
  const { t } = useTranslation()
  const { value: base } = useAccountProxyBase()
  if (base === undefined || base === 'ERROR' || base === UNSUPPORTED) return null
  return (
    <List data-proxy-base={base?.state ?? 'none'}>
      <ListSubheader>{t('proxiesPage.ownDomain', 'Your own domain')}</ListSubheader>
      <ListItemLocation
        to="/proxies/base"
        match="/proxies/base"
        icon={<Icon name="sitemap" size="md" color={baseColor(base)} fixedWidth />}
        title={base?.base ?? t('proxiesPage.ownDomainNone', 'Not set up')}
        subtitle={
          base
            ? baseStateLine(t, base)
            : t('proxiesPage.ownDomainLine', 'A paid add-on that puts your public addresses under a domain you own.')
        }
      />
    </List>
  )
}

const baseColor = (base: AccountProxyBase | null) =>
  !base ? 'grayDark' : base.state === 'active' ? 'primary' : base.state === 'broken' ? 'danger' : 'warning'

export const serving = (proxy: Pick<ListedProxy, 'devices'>) =>
  !!proxy.devices?.some(
    device => device.state === 'ACTIVE' && !device.joining && !device.disabled && !outOfService(device)
  )

export function proxyLine(t: TFunction, proxy: ListedProxy): string {
  return [
    proxySummary(t, proxy),
    proxy.ownName ? ownNameLine(t, proxy.ownName) : proxy.host,
    proxy.certificate === 'pending' ? t('proxiesPage.certificatePending', 'Certificate pending') : '',
  ]
    .filter(Boolean)
    .join(' · ')
}

export function ownNameLine(t: TFunction, own: ProxyOwnNameBrief): string {
  if (own.state === 'pending') return t('proxiesPage.ownNamePending', '{{name}} (pending)', { name: own.name })
  if (own.state === 'verified') return t('proxiesPage.ownNameVerified', '{{name}} (not moved yet)', { name: own.name })
  if (own.state === 'broken') return t('proxiesPage.ownNameBroken', '{{name}} (broken)', { name: own.name })
  return own.name
}
