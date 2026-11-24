import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Box, Button, List, ListItem, ListItemText, Typography } from '@mui/material'
import { getApplicationType, isWebType } from '@common/applications'
import { selectActiveAccountId } from '../selectors/accounts'
import type { State } from '../store'
import { useDeviceSessions } from '../hooks/useDeviceSessions'
import { useLocalSubnetName } from '../hooks/useLocalSubnetName'
import { useServiceShortcutsSupport } from '../hooks/useServiceShortcutsSupport'
import { graphQLServiceShortcuts, ServiceShortcut } from '../services/graphQLServiceShortcuts'
import { openThroughGateway } from '../services/browserGateway'
import { openServiceURL } from '../services/browser'
import { subnetWebURL } from '../services/localSubnet'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { LoadingMessage } from '../components/LoadingMessage'
import { Notice } from '../components/Notice'
import { IconButton } from '../buttons/IconButton'
import { useReadEffect } from '../hooks/useReadAgain'

export function ServicesPage() {
  const accountId = useSelector(selectActiveAccountId)
  return <AccountServices key={accountId} accountId={accountId} />
}

function AccountServices({ accountId }: { accountId: string }) {
  const { t } = useTranslation()
  const deviceSessions = useDeviceSessions()
  const [revision, setRevision] = useState(0)
  const refresh = () => setRevision(value => value + 1)
  const support = useServiceShortcutsSupport(true, revision)
  const [services, setServices] = useState<ServiceShortcut[] | 'ERROR'>()
  const available = !!support && support !== 'ERROR' && support.available
  const namedAddress = available && support.namedAddress && deviceSessions

  useReadEffect(
    again => {
      if (!available) return
      let current = true
      if (!again) setServices(undefined)
      graphQLServiceShortcuts(accountId, namedAddress).then(result => {
        if (!current) return
        if (result === 'ERROR') setServices(result)
        else
          setServices(
            [...result].sort((a, b) => a.name.localeCompare(b.name) || a.device.name.localeCompare(b.device.name))
          )
      })
      return () => {
        current = false
      }
    },
    [accountId, available, namedAddress, revision]
  )

  return (
    <Container
      bodyProps={{ verticalOverflow: true }}
      header={
        <Gutters sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h1">{t('nav.services', 'Services')}</Typography>
          <IconButton icon="sync" title={t('serviceShortcuts.refresh', 'Refresh services')} onClick={refresh} />
        </Gutters>
      }
    >
      {support === 'ERROR' || services === 'ERROR' ? (
        <Gutters>
          <Notice severity="error">{t('serviceShortcuts.loadFailed', 'Could not load services.')}</Notice>
        </Gutters>
      ) : support && !available ? (
        <Gutters>
          <Notice>{t('serviceShortcuts.unsupported', 'This server does not have a Services page.')}</Notice>
        </Gutters>
      ) : services === undefined ? (
        <LoadingMessage />
      ) : services.length === 0 ? (
        <Gutters>
          <Typography color="text.secondary">
            {t(
              'serviceShortcuts.empty',
              'No services to show. Turn on Show in Services in a service’s settings to add it here.'
            )}
          </Typography>
          <Button component={Link} to="/devices" sx={{ mt: 1 }}>
            {t('nav.devices', 'Devices')}
          </Button>
        </Gutters>
      ) : (
        <List disablePadding>
          {services.map(service => (
            <ServiceRow key={service.id} service={service} />
          ))}
        </List>
      )}
    </Container>
  )
}

function ServiceRow({ service }: { service: ServiceShortcut }) {
  const { t } = useTranslation()
  const [opening, setOpening] = useState(false)
  const [failed, setFailed] = useState(false)
  const to = `/devices/${service.device.id}/${service.id}/connect`
  const online = service.enabled && service.state === 'active'
  const type = useSelector((state: State) => state.applicationTypes.all.find(type => type.id === service.application))
  const web = isWebType(getApplicationType(service.application), type)
  const name = web ? service.subnetName : undefined
  const port = service.subnetPort
  // Only the default HTTPS port can be opened through the browser gateway.
  const needsLocal = online && !!name && !!port && port !== 443
  const local = useLocalSubnetName(needsLocal ? service.device.id : undefined, needsLocal ? service.id : undefined)
  const destination = port === 443 ? name : needsLocal ? local?.name : undefined
  const status = !service.enabled
    ? t('serviceShortcuts.disabled', 'Disabled')
    : service.state === 'unlicensed'
    ? t('statusChip.unlicensed', 'Unlicensed')
    : t('statusChip.offline', 'Offline')

  const open = async () => {
    if (!destination || !port) return
    setOpening(true)
    try {
      // Not opened — or not the browser's client's to open (another sign-in's service): Connect is offered either way.
      if (port === 443) setFailed((await openThroughGateway(destination, service.id)) !== true)
      else await openServiceURL(subnetWebURL(destination, port))
    } catch {
      setFailed(true)
    } finally {
      setOpening(false)
    }
  }

  return (
    <ListItem divider sx={{ alignItems: 'flex-start', gap: 2, px: { xs: 2, sm: 3 }, py: 1.25 }}>
      <ListItemText
        sx={{ minWidth: 0, my: 0 }}
        primary={
          <Box component={Link} to={to} sx={{ color: 'text.primary', overflowWrap: 'anywhere' }}>
            {service.name}
          </Box>
        }
        secondary={
          <>
            {online ? service.device.name : `${service.device.name} · ${status}`}
            {failed && (
              <Typography component="span" display="block" variant="caption" color="error">
                {t('serviceShortcuts.openFailed', 'Could not open the service. Try the Connect button.')}
              </Typography>
            )}
          </>
        }
      />
      {online && destination && !failed ? (
        <Button size="small" variant="contained" disabled={opening} onClick={open}>
          {t('serviceShortcuts.open', 'Open')}
        </Button>
      ) : (
        <Button size="small" variant="outlined" component={Link} to={to}>
          {t('serviceShortcuts.connect', 'Connect')}
        </Button>
      )}
    </ListItem>
  )
}
