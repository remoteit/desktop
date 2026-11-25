import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useReadEffect } from '../hooks/useReadAgain'
import { useHistory, useLocation } from 'react-router-dom'
import {
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
import { FormField, choiceListSx } from '../components/FormField'
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

  useReadEffect(() => {
    graphQLServiceChoices(accountId).then(setServices)
  }, [accountId])

  useReadEffect(() => {
    graphQLProxies(serviceId ? { about: [serviceId] } : undefined).then(list =>
      setProxies(Array.isArray(list) ? list : [])
    )
  }, [accountId, serviceId])

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
      <Typography variant="subtitle1">{t('publicAddressAdd.service', 'Service')}</Typography>
      {services === undefined ? (
        <LoadingMessage />
      ) : services === 'ERROR' ? (
        <Gutters top={null}>
          <Notice severity="error" fullWidth>
            {t('publicAddressAdd.servicesFailed', 'Couldn’t load your services. Try again.')}
          </Notice>
        </Gutters>
      ) : !list.length ? (
        <Gutters top={null}>
          <Typography variant="body2" color="textSecondary">
            {t('publicAddressAdd.noServices', 'You have no services yet. Add one to a device first.')}
          </Typography>
        </Gutters>
      ) : (
        <>
          {list.length > 6 && (
            <FormField>
              <TextField
                variant="filled"
                label={t('publicAddressAdd.search', 'Find a service or device')}
                value={search}
                onChange={event => setSearch(event.target.value)}
              />
            </FormField>
          )}
          <List dense disablePadding sx={{ ...choiceListSx, maxHeight: 280, overflowY: 'auto' }} data-services>
            {shown.map(each => (
              <ListItemButton
                key={each.id}
                dense
                selected={each.id === serviceId}
                onClick={() => setServiceId(each.id)}
                data-service={each.id}
              >
                <ListItemIcon>
                  <Radio size="small" checked={each.id === serviceId} tabIndex={-1} disableRipple />
                </ListItemIcon>
                <ListItemText primary={each.name} secondary={each.device.name} />
              </ListItemButton>
            ))}
          </List>
        </>
      )}
      {service && (
        <List data-form>
          <FormField>
            <TextField
              select
              variant="filled"
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
          </FormField>
          {chosenAccess === 'ip-locked' && (
            <FormField>
              <TextField
                variant="filled"
                label={t('publicAddressAdd.lockedIp', 'Allowed address')}
                value={lockedIp}
                onChange={event => setLockedIp(event.target.value.trim())}
              />
            </FormField>
          )}
          {chosenAccess === 'cidr' && (
            <FormField>
              <TextField
                variant="filled"
                label={t('publicAddressAdd.allow', 'Allowed addresses, like 203.0.113.0/24, comma separated')}
                value={allow}
                onChange={event => setAllow(event.target.value)}
              />
            </FormField>
          )}
          <FormField>
            <TextField
              select
              variant="filled"
              label={t('publicAddressAdd.kind', 'Kind')}
              value={kind}
              onChange={event => setKind(event.target.value as EndpointKind)}
            >
              <MenuItem value="https">{t('publicAddressAdd.https', 'Web (HTTPS), opens in a browser')}</MenuItem>
              <MenuItem value="tcp">{t('publicAddressAdd.tcp', 'TCP, a port for apps')}</MenuItem>
              <MenuItem value="udp">{t('publicAddressAdd.udp', 'UDP, a port for apps')}</MenuItem>
            </TextField>
          </FormField>
          <FormField help={t('publicAddressAdd.lifetimeHint', 'You can’t change this later.')}>
            <TextField
              select
              variant="filled"
              label={t('publicAddressAdd.lifetime', 'How long it lasts')}
              value={lifetime}
              onChange={event => setLifetime(event.target.value as EndpointLifetime)}
            >
              <MenuItem value="permanent">{t('publicAddressAdd.permanent', 'Until you remove it')}</MenuItem>
              <MenuItem value="temporary">{t('publicAddressAdd.temporary', 'Until unused for 15 minutes')}</MenuItem>
            </TextField>
          </FormField>
          <FormField>
            <TextField
              select
              variant="filled"
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
                    : [proxy.name, proxy.local ? t('proxies.local', 'Local network') : ''].filter(Boolean).join(' · ')}
                </MenuItem>
              ))}
            </TextField>
          </FormField>
        </List>
      )}
      {refusal && (
        <Gutters>
          <Notice severity="error" fullWidth>
            {refusal}
          </Notice>
        </Gutters>
      )}
      <Gutters top="lg">
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
