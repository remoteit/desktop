import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useHistory, useLocation } from 'react-router-dom'
import {
  Box,
  Button,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Radio,
  TextField,
  Typography,
} from '@mui/material'
import { selectActiveAccountId } from '../selectors/accounts'
import {
  EndpointAccess,
  EndpointKind,
  EndpointLifetime,
  ProxyChoice,
  graphQLCreateEndpoint,
  graphQLProxies,
} from '../services/graphQLProxy'
import { ServiceChoice, graphQLServiceChoices } from '../services/graphQLPublicAddresses'
import { graphQLGetErrors } from '../services/graphQL'
import { LoadingMessage } from '../components/LoadingMessage'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'

/* A new public address: first the service, then the proxy server, kind, who may use it (signed in by default) and how
   long it lasts, then Create public address. A service may be chosen ahead with ?service=<id>. */
export const PublicAddressAddPage: React.FC = () => {
  const { t } = useTranslation()
  const history = useHistory()
  const location = useLocation()
  const accountId = useSelector(selectActiveAccountId)
  const [services, setServices] = useState<ServiceChoice[] | 'ERROR'>()
  const [proxies, setProxies] = useState<ProxyChoice[]>([])
  const [search, setSearch] = useState('')
  const [serviceId, setServiceId] = useState(new URLSearchParams(location.search).get('service') ?? '')
  const [proxyId, setProxyId] = useState('')
  const [kind, setKind] = useState<EndpointKind>('https')
  const [access, setAccess] = useState<EndpointAccess>('signed-in')
  const [lifetime, setLifetime] = useState<EndpointLifetime>('permanent')
  const [lockedIp, setLockedIp] = useState('')
  const [allow, setAllow] = useState('')
  const [busy, setBusy] = useState(false)
  const [refusal, setRefusal] = useState<string>()

  useEffect(() => {
    graphQLServiceChoices(accountId).then(setServices)
    graphQLProxies().then(list => Array.isArray(list) && setProxies(list))
  }, [accountId])

  const list = Array.isArray(services) ? services : []
  const service = list.find(each => each.id === serviceId)
  const query = search.trim().toLowerCase()
  const shown = query ? list.filter(each => `${each.name} ${each.device.name}`.toLowerCase().includes(query)) : list
  const accesses = accessChoices(t, kind, !!service?.manage)
  const chosenAccess = accesses.some(each => each.key === access) ? access : accesses[0].key
  const usable = proxies.filter(proxy => proxy.publicEndpoints || chosenAccess !== 'public')

  const create = async () => {
    if (!service) return
    setBusy(true)
    setRefusal(undefined)
    const result = await graphQLCreateEndpoint(service.id, {
      kind,
      access: chosenAccess,
      lifetime,
      proxy: proxyId || undefined,
      lockedIp: chosenAccess === 'ip-locked' ? lockedIp : undefined,
      allow:
        chosenAccess === 'cidr'
          ? allow
              .split(',')
              .map(each => each.trim())
              .filter(Boolean)
          : undefined,
    })
    setBusy(false)
    const errors = result === 'ERROR' ? true : graphQLGetErrors(result)
    if (errors) return setRefusal(t('publicAddressAdd.failed', 'Couldn’t create the public address. Try again.'))
    history.push('/public-addresses')
  }

  return (
    <Container
      gutterBottom
      bodyProps={{ verticalOverflow: true }}
      header={
        <>
          <Typography variant="h1">
            <Title>{t('publicAddressAdd.title', 'Add public address')}</Title>
          </Typography>
          <Gutters top={null} bottom="sm">
            <Typography variant="body2" color="textSecondary">
              {t('publicAddressAdd.intro', 'Choose the service, then who may use its address.')}
            </Typography>
          </Gutters>
        </>
      }
    >
      <Gutters>
        <Box display="flex" flexDirection="column" gap={3} maxWidth={560}>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              {t('publicAddressAdd.service', 'Service')}
            </Typography>
            {services === undefined ? (
              <LoadingMessage />
            ) : services === 'ERROR' ? (
              <Notice severity="error" fullWidth>
                {t('publicAddressAdd.servicesFailed', 'Couldn’t load your services. Try again.')}
              </Notice>
            ) : !list.length ? (
              <Typography variant="body2" color="textSecondary">
                {t('publicAddressAdd.noServices', 'You have no services yet. Add one to a device first.')}
              </Typography>
            ) : (
              <>
                {list.length > 6 && (
                  <TextField
                    fullWidth
                    label={t('publicAddressAdd.search', 'Find a service or device')}
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    sx={{ marginBottom: 1 }}
                  />
                )}
                <List dense disablePadding sx={{ maxHeight: 280, overflowY: 'auto', '& .MuiListItemIcon-root': { justifyContent: 'flex-start' } }} data-services>
                  {shown.map(each => (
                    <ListItemButton
                      key={each.id}
                      dense
                      disableGutters
                      selected={each.id === serviceId}
                      onClick={() => setServiceId(each.id)}
                      data-service={each.id}
                    >
                      <ListItemIcon>
                        <Radio edge="start" size="small" checked={each.id === serviceId} tabIndex={-1} disableRipple />
                      </ListItemIcon>
                      <ListItemText primary={each.name} secondary={each.device.name} />
                    </ListItemButton>
                  ))}
                </List>
              </>
            )}
          </Box>
          {service && (
            <Box display="flex" flexDirection="column" gap={2.5} data-form>
              <TextField
                select
                label={t('publicAddressAdd.who', 'Who may use it')}
                value={chosenAccess}
                onChange={event => setAccess(event.target.value as EndpointAccess)}
              >
                {accesses.map(each => (
                  <MenuItem key={each.key} value={each.key}>
                    {each.name}
                  </MenuItem>
                ))}
              </TextField>
              {chosenAccess === 'ip-locked' && (
                <TextField
                  label={t('publicAddressAdd.lockedIp', 'Allowed address')}
                  value={lockedIp}
                  onChange={event => setLockedIp(event.target.value.trim())}
                />
              )}
              {chosenAccess === 'cidr' && (
                <TextField
                  label={t('publicAddressAdd.allow', 'Allowed addresses, like 203.0.113.0/24, comma separated')}
                  value={allow}
                  onChange={event => setAllow(event.target.value)}
                />
              )}
              <TextField
                select
                label={t('publicAddressAdd.kind', 'Kind')}
                value={kind}
                onChange={event => setKind(event.target.value as EndpointKind)}
              >
                <MenuItem value="https">{t('publicAddressAdd.https', 'Web (HTTPS), opens in a browser')}</MenuItem>
                <MenuItem value="tcp">{t('publicAddressAdd.tcp', 'TCP, a port for apps')}</MenuItem>
                <MenuItem value="udp">{t('publicAddressAdd.udp', 'UDP, a port for apps')}</MenuItem>
              </TextField>
              <TextField
                select
                label={t('publicAddressAdd.lifetime', 'How long it lasts')}
                value={lifetime}
                helperText={t('publicAddressAdd.lifetimeHint', 'You can’t change this later.')}
                onChange={event => setLifetime(event.target.value as EndpointLifetime)}
              >
                <MenuItem value="permanent">{t('publicAddressAdd.permanent', 'Until you remove it')}</MenuItem>
                <MenuItem value="temporary">{t('publicAddressAdd.temporary', 'Until unused for 15 minutes')}</MenuItem>
              </TextField>
              <TextField
                select
                label={t('publicAddressAdd.proxy', 'Proxy server')}
                value={proxyId}
                SelectProps={{ displayEmpty: true }}
                InputLabelProps={{ shrink: true }}
                onChange={event => setProxyId(event.target.value)}
              >
                <MenuItem value="">{t('publicAddressAdd.nearest', 'Remote.It, nearest the device')}</MenuItem>
                {usable.map(proxy => (
                  <MenuItem key={proxy.id} value={proxy.id}>
                    {proxy.remoteit
                      ? [proxy.name, proxy.location || proxy.provider].filter(Boolean).join(' · ')
                      : [proxy.name, proxy.local ? t('proxies.local', 'Local network') : '']
                          .filter(Boolean)
                          .join(' · ')}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          )}
          {refusal && (
            <Notice severity="error" fullWidth>
              {refusal}
            </Notice>
          )}
          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              disabled={
                busy ||
                !service ||
                (chosenAccess === 'ip-locked' && !lockedIp) ||
                (chosenAccess === 'cidr' && !allow.trim())
              }
              onClick={create}
              data-create
            >
              {t('publicAddressAdd.create', 'Create public address')}
            </Button>
            <Button disabled={busy} onClick={() => history.push('/public-addresses')}>
              {t('exitAdd.cancel', 'Cancel')}
            </Button>
          </Box>
        </Box>
      </Gutters>
    </Container>
  )
}

// Who may use a new address: signed in only on HTTPS, where there is a page to sign in on; anyone only for whoever
// manages the service.
export function accessChoices(
  t: (key: string, text: string) => string,
  kind: EndpointKind,
  manage: boolean
): { key: EndpointAccess; name: string }[] {
  return [
    ...(kind === 'https'
      ? [{ key: 'signed-in' as const, name: t('publicAddress.signedIn', 'People who may connect, signed in') }]
      : []),
    { key: 'latch', name: t('publicAddressAdd.latch', 'Its first user only') },
    { key: 'ip-locked', name: t('publicAddressAdd.ipLocked', 'One address') },
    { key: 'cidr', name: t('publicAddressAdd.cidr', 'Addresses I list') },
    ...(manage ? [{ key: 'public' as const, name: t('publicAddress.anyone', 'Anyone with the address') }] : []),
  ]
}
