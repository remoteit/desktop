import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Button, List, ListItem, ListItemIcon, ListItemText, TextField, Typography } from '@mui/material'
import {
  Endpoint,
  EndpointAccess,
  EndpointKind,
  EndpointLifetime,
  ProxyChoice,
  endpointAddress,
  graphQLCreateEndpoint,
  graphQLProxies,
  graphQLRemoveEndpoint,
  graphQLServiceEndpoints,
} from '../services/graphQLProxy'
import { UNSUPPORTED } from '../services/graphQLDaemon'
import { AccordionMenuItem } from './AccordionMenuItem'
import { SelectSetting } from './SelectSetting'
import { ConfirmIconButton } from '../buttons/ConfirmIconButton'
import { CopyIconButton } from '../buttons/CopyIconButton'
import { ProxyAccessList } from './ProxyAccessList'
import { EndpointLocalAddresses } from './EndpointLocalAddresses'
import { TransferUsageHintText, useTransferUsageHint } from './TransferUsage'
import { Timestamp } from './Timestamp'
import { Icon } from './Icon'

const KIND_ICON: Record<EndpointKind, string> = { https: 'globe', tcp: 'arrow-right-arrow-left', udp: 'wave-pulse' }

type Props = { device: IDevice; service: IService }

const changed = new Set<(serviceId: string) => void>()

/** A public address made elsewhere on the page (the Connect button's): the section lists it at once. */
export const refreshEndpoints = (serviceId: string) => changed.forEach(listener => listener(serviceId))

/* A service's endpoints on proxies (presence-server docs/proxy-plan.md): its addresses through remote.it's proxies or
   one of yours — a name for https, a port for tcp and udp, at graphql's address for each, under its proxy's own name
   once that is active; on a local network proxy (graphql-api docs/PROXY-GROUPS.md §14), said to be reached on its
   devices' own network only, with its .local name and, a tcp or udp one, each device's IP and port after its public
   name — and making one; and, for whoever manages the service, who used them (components/ProxyAccessList.tsx).
   Device-session API only: on an API without it, nothing shows. */
export const EndpointsAccordion: React.FC<Props> = ({ device, service }) => {
  const { t } = useTranslation()
  const [endpoints, setEndpoints] = useState<Endpoint[] | 'ERROR' | typeof UNSUPPORTED>()
  const [proxies, setProxies] = useState<ProxyChoice[]>([])
  const [adding, setAdding] = useState(false)
  const [open, setOpen] = useState(true)
  const [busy, setBusy] = useState(false)
  const manage = device.permissions.includes('MANAGE')
  // Public-proxy transfer is charged to the account whose service it is, and only on remote.it's proxies.
  const usage = useTransferUsageHint(
    device.owner?.id,
    'proxy',
    Array.isArray(endpoints) && endpoints.some(endpoint => endpoint.proxy.remoteit)
  )

  const load = useCallback(async () => {
    setEndpoints(await graphQLServiceEndpoints(device.id, service.id))
  }, [device.id, service.id])

  useEffect(() => {
    setEndpoints(undefined)
    load()
  }, [load])

  useEffect(() => {
    const listener = (id: string) => id === service.id && load()
    changed.add(listener)
    return () => {
      changed.delete(listener)
    }
  }, [load, service.id])

  useEffect(() => {
    if (adding && !proxies.length)
      graphQLProxies().then(list => {
        if (Array.isArray(list)) setProxies(list)
      })
  }, [adding])

  if (endpoints === UNSUPPORTED || endpoints === undefined) return null

  const remove = async (id: string) => {
    setBusy(true)
    if ((await graphQLRemoveEndpoint(id)) !== 'ERROR') await load()
    setBusy(false)
  }

  const accessLabel = (endpoint: Endpoint) => {
    switch (endpoint.access) {
      case 'public':
        return t('endpoints.public', 'Anyone with the address')
      case 'signed-in':
        return t('endpoints.signedIn', 'People who may connect, signed in')
      case 'ip-locked':
        return t('endpoints.ipLocked', 'Only {{ip}}', { ip: endpoint.lockedIp })
      case 'latch':
        return t('endpoints.firstUserOnly', 'Only the first person to use it')
      case 'cidr':
        return t('endpoints.cidr', 'Only {{allow}}', { allow: endpoint.allow?.join(', ') })
    }
  }

  return (
    <AccordionMenuItem
      gutters
      subtitle={t('endpoints.publicAddress', 'Public address')}
      expanded={open}
      onClick={setOpen}
      elevation={0}
      action={
        <Button
          size="small"
          variant="text"
          color="primary"
          startIcon={<Icon name={adding ? 'times' : 'plus'} size="sm" />}
          onClick={event => {
            event.stopPropagation()
            setOpen(true)
            setAdding(!adding)
          }}
        >
          {adding ? t('endpoints.cancel', 'Cancel') : t('endpoints.addPublicAddress', 'Add public address')}
        </Button>
      }
    >
      {endpoints === 'ERROR' && (
        <Typography variant="body2" color="error" paddingX={2}>
          {t('endpoints.readError', "Couldn't load public addresses. Reload the page to try again.")}
        </Typography>
      )}
      {Array.isArray(endpoints) && !endpoints.length && !adding && (
        <Typography variant="body2" color="textSecondary" paddingX={2} paddingBottom={1}>
          {t('endpoints.noneYet', 'No public address yet. Add one to share this service with a web link.')}
        </Typography>
      )}
      {Array.isArray(endpoints) && endpoints.length > 0 && (
        <List dense disablePadding>
          {endpoints.map(endpoint => (
            <ListItem
              key={endpoint.id}
              // Room for both its actions: its lines wrap before them, never under them.
              sx={{ paddingRight: 14 }}
              secondaryAction={
                <Box display="flex">
                  <CopyIconButton
                    value={endpointAddress(endpoint)}
                    title={t('endpoints.copyAddress', 'Copy address')}
                  />
                  <ConfirmIconButton
                    icon="trash"
                    title={t('endpoints.remove', 'Remove')}
                    disabled={busy}
                    confirm
                    confirmProps={{
                      title: t('endpoints.removeAddress', 'Remove this public address?'),
                      children: t(
                        'endpoints.removeAddressBody',
                        '{{address}} stops working for everyone who uses it.',
                        {
                          address: endpointAddress(endpoint),
                        }
                      ),
                    }}
                    onClick={() => remove(endpoint.id)}
                  />
                </Box>
              }
            >
              <ListItemIcon>
                <Icon name={KIND_ICON[endpoint.kind]} size="md" fixedWidth />
              </ListItemIcon>
              <ListItemText
                primary={endpointAddress(endpoint)}
                primaryTypographyProps={{ sx: { wordBreak: 'break-all' } }}
                secondaryTypographyProps={{ component: 'div' }}
                secondary={
                  <>
                    {accessLabel(endpoint)}
                    {' · '}
                    {endpoint.lifetime === 'permanent' ? (
                      t('endpoints.permanent', 'permanent')
                    ) : endpoint.expires ? (
                      <>
                        {t('endpoints.endsIfUnused', 'ends if unused')} <Timestamp date={new Date(endpoint.expires)} />
                      </>
                    ) : (
                      t('endpoints.temporary', 'temporary')
                    )}
                    {!endpoint.proxy.remoteit &&
                      ` · ${t('endpoints.via', 'via {{host}}', { host: endpoint.proxy.host })}`}
                    {endpoint.proxy.local && ` · ${t('proxies.localOnlyNone', 'Local network only')}`}
                    <EndpointLocalAddresses endpoint={endpoint} />
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
      {usage && (
        <Box paddingX={2} paddingBottom={1}>
          <TransferUsageHintText hint={usage} />
        </Box>
      )}
      {adding && (
        <EndpointForm
          proxies={proxies}
          manage={manage}
          onCreate={async endpoint => {
            setBusy(true)
            const result = await graphQLCreateEndpoint(service.id, endpoint)
            setBusy(false)
            if (result === 'ERROR') return
            setAdding(false)
            await load()
          }}
          busy={busy}
        />
      )}
      {manage && (
        <>
          <Typography variant="subtitle2" paddingX={2} paddingTop={1}>
            {t('proxyAccess.title', 'Recent visitors')}
          </Typography>
          <ProxyAccessList scope={{ serviceId: service.id }} showEndpoint />
        </>
      )}
    </AccordionMenuItem>
  )
}

type FormProps = {
  proxies: ProxyChoice[]
  manage: boolean
  busy: boolean
  onCreate: (endpoint: {
    kind: EndpointKind
    access: EndpointAccess
    lifetime: EndpointLifetime
    proxy?: string
    lockedIp?: string
    allow?: string[]
  }) => void
}

const EndpointForm: React.FC<FormProps> = ({ proxies, manage, busy, onCreate }) => {
  const { t } = useTranslation()
  const [kind, setKind] = useState<EndpointKind>('https')
  const [access, setAccess] = useState<EndpointAccess>('signed-in')
  const [lifetime, setLifetime] = useState<EndpointLifetime>('temporary')
  const [proxyId, setProxyId] = useState('')
  const [lockedIp, setLockedIp] = useState('')
  const [allow, setAllow] = useState('')

  // Who may use it: public only for whoever manages the service; signed-in only on https, where there is a page to
  // sign in on. Open to anyone is listed last and never chosen for the person.
  const accesses: { key: EndpointAccess; name: string }[] = [
    ...(kind === 'https'
      ? [{ key: 'signed-in' as const, name: t('endpoints.signedIn', 'People who may connect, signed in') }]
      : []),
    { key: 'latch', name: t('endpoints.firstUserChoice', 'Only the first person to use it') },
    { key: 'ip-locked', name: t('endpoints.oneIpChoice', 'One IP address') },
    { key: 'cidr', name: t('endpoints.listedIpsChoice', 'IP addresses I list') },
    ...(manage ? [{ key: 'public' as const, name: t('endpoints.public', 'Anyone with the address') }] : []),
  ]
  const chosenAccess = accesses.some(a => a.key === access) ? access : accesses[0].key
  const usable = proxies.filter(p => p.publicEndpoints || chosenAccess !== 'public')

  return (
    <Box paddingX={2} paddingBottom={2}>
      <List disablePadding>
        <SelectSetting
          icon="server"
          label={t('endpoints.proxyServer', 'Proxy server')}
          value={proxyId}
          values={[
            { key: '', name: t('endpoints.nearestRemoteit', "Remote.It's, nearest the device") },
            ...usable.map(p => ({
              key: p.id,
              name: p.remoteit
                ? [p.name, p.provider].filter(Boolean).join(' · ')
                : [p.name, p.host, p.local ? t('proxies.local', 'Local network') : ''].filter(Boolean).join(' · '),
            })),
          ]}
          onChange={setProxyId}
        />
        <SelectSetting
          icon="plug"
          label={t('endpoints.kind', 'Kind')}
          value={kind}
          values={[
            { key: 'https', name: t('endpoints.httpsAddress', 'HTTPS (a web address)') },
            { key: 'tcp', name: t('endpoints.tcpPort', 'TCP (a port)') },
            { key: 'udp', name: t('endpoints.udpPort', 'UDP (a port)') },
          ]}
          onChange={value => setKind(value as EndpointKind)}
        />
        <SelectSetting
          icon="user-lock"
          label={t('endpoints.access', 'Who may use it')}
          value={chosenAccess}
          values={accesses}
          onChange={value => setAccess(value as EndpointAccess)}
        />
        <SelectSetting
          icon="clock"
          label={t('endpoints.lifetime', 'Lifetime')}
          value={lifetime}
          values={[
            { key: 'temporary', name: t('endpoints.temporaryIdle', 'Temporary (ends after 15 idle minutes)') },
            { key: 'permanent', name: t('endpoints.permanentKept', 'Permanent (kept until you remove it)') },
          ]}
          helpMessage={t('endpoints.lifetimeFixed', "A temporary address can't be made permanent later.")}
          onChange={value => setLifetime(value as EndpointLifetime)}
        />
      </List>
      {chosenAccess === 'ip-locked' && (
        <TextField
          fullWidth
          size="small"
          label={t('endpoints.allowedIp', 'The IP address allowed')}
          value={lockedIp}
          onChange={event => setLockedIp(event.target.value.trim())}
          sx={{ marginTop: 1 }}
        />
      )}
      {chosenAccess === 'cidr' && (
        <TextField
          fullWidth
          size="small"
          label={t('endpoints.allowedIps', 'IP addresses allowed, like 203.0.113.0/24, separated by commas')}
          value={allow}
          onChange={event => setAllow(event.target.value)}
          sx={{ marginTop: 1 }}
        />
      )}
      <Button
        variant="contained"
        size="small"
        sx={{ marginTop: 2 }}
        disabled={busy || (chosenAccess === 'ip-locked' && !lockedIp) || (chosenAccess === 'cidr' && !allow.trim())}
        onClick={() =>
          onCreate({
            kind,
            access: chosenAccess,
            lifetime,
            proxy: proxyId || undefined,
            lockedIp: chosenAccess === 'ip-locked' ? lockedIp : undefined,
            allow:
              chosenAccess === 'cidr'
                ? allow
                    .split(',')
                    .map(s => s.trim())
                    .filter(Boolean)
                : undefined,
          })
        }
      >
        {t('endpoints.createPublicAddress', 'Create public address')}
      </Button>
    </Box>
  )
}
