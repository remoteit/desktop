import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Button, List, ListItem, ListItemIcon, ListItemText, TextField, Typography } from '@mui/material'
import {
  Endpoint,
  EndpointAccess,
  EndpointKind,
  EndpointLifetime,
  Proxy,
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
import { IconButton } from '../buttons/IconButton'
import { Timestamp } from './Timestamp'
import { Icon } from './Icon'

const KIND_ICON: Record<EndpointKind, string> = { https: 'globe', tcp: 'arrow-right-arrow-left', udp: 'wave-pulse' }

type Props = { device: IDevice; service: IService }

/* A service's endpoints on proxies (presence-server docs/proxy-plan.md): its addresses through remote.it's proxies or
   one of yours — a name for https, a port for tcp and udp — and making one. Device-session API only: on an API without
   it, nothing shows. */
export const EndpointsAccordion: React.FC<Props> = ({ device, service }) => {
  const { t } = useTranslation()
  const [endpoints, setEndpoints] = useState<Endpoint[] | 'ERROR' | typeof UNSUPPORTED>()
  const [proxies, setProxies] = useState<Proxy[]>([])
  const [adding, setAdding] = useState(false)
  const [busy, setBusy] = useState(false)
  const manage = device.permissions.includes('MANAGE')

  const load = useCallback(async () => {
    setEndpoints(await graphQLServiceEndpoints(device.id, service.id))
  }, [device.id, service.id])

  useEffect(() => {
    setEndpoints(undefined)
    load()
  }, [load])

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
        return t('endpoints.latch', 'Only its first user')
      case 'cidr':
        return t('endpoints.cidr', 'Only {{allow}}', { allow: endpoint.allow?.join(', ') })
    }
  }

  return (
    <AccordionMenuItem
      gutters
      subtitle={t('endpoints.title', 'Proxy endpoints')}
      defaultExpanded
      elevation={0}
      action={
        <IconButton
          icon={adding ? 'times' : 'plus'}
          title={adding ? t('endpoints.cancel', 'Cancel') : t('endpoints.add', 'Add an endpoint')}
          onClick={event => {
            event.stopPropagation()
            setAdding(!adding)
          }}
        />
      }
    >
      {endpoints === 'ERROR' && (
        <Typography variant="body2" color="error" paddingX={2}>
          {t('endpoints.error', 'Could not read the endpoints.')}
        </Typography>
      )}
      {Array.isArray(endpoints) && !endpoints.length && !adding && (
        <Typography variant="body2" color="textSecondary" paddingX={2} paddingBottom={1}>
          {t('endpoints.none', 'None yet: an address for this service through a proxy, for anyone you choose.')}
        </Typography>
      )}
      {Array.isArray(endpoints) && endpoints.length > 0 && (
        <List dense disablePadding>
          {endpoints.map(endpoint => (
            <ListItem
              key={endpoint.id}
              secondaryAction={
                <Box display="flex">
                  <CopyIconButton value={endpointAddress(endpoint)} title={t('endpoints.copy', 'Copy the address')} />
                  <ConfirmIconButton
                    icon="trash"
                    title={t('endpoints.remove', 'Remove')}
                    disabled={busy}
                    confirm
                    confirmProps={{
                      title: t('endpoints.removeConfirm', 'Remove this endpoint?'),
                      children: t('endpoints.removeConfirmBody', '{{address}} stops working for everyone using it.', {
                        address: endpointAddress(endpoint),
                      }),
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
                secondary={
                  <>
                    {accessLabel(endpoint)}
                    {' · '}
                    {endpoint.lifetime === 'permanent' ? (
                      t('endpoints.permanent', 'permanent')
                    ) : endpoint.expires ? (
                      <>
                        {t('endpoints.idleUntil', 'unless used, released')}{' '}
                        <Timestamp date={new Date(endpoint.expires)} />
                      </>
                    ) : (
                      t('endpoints.temporary', 'temporary')
                    )}
                    {endpoint.proxy.kind === 'own' &&
                      ` · ${t('endpoints.via', 'via {{host}}', { host: endpoint.proxy.host })}`}
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
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
    </AccordionMenuItem>
  )
}

type FormProps = {
  proxies: Proxy[]
  manage: boolean
  busy: boolean
  onCreate: (endpoint: {
    kind: EndpointKind
    access: EndpointAccess
    lifetime: EndpointLifetime
    proxyId?: string
    lockedIp?: string
    allow?: string[]
  }) => void
}

const EndpointForm: React.FC<FormProps> = ({ proxies, manage, busy, onCreate }) => {
  const { t } = useTranslation()
  const [kind, setKind] = useState<EndpointKind>('https')
  const [access, setAccess] = useState<EndpointAccess>(manage ? 'public' : 'signed-in')
  const [lifetime, setLifetime] = useState<EndpointLifetime>('temporary')
  const [proxyId, setProxyId] = useState('')
  const [lockedIp, setLockedIp] = useState('')
  const [allow, setAllow] = useState('')

  // Who may use it: public only for whoever manages the service; signed-in only on https, where there is a page to
  // sign in on.
  const accesses: { key: EndpointAccess; name: string }[] = [
    ...(manage ? [{ key: 'public' as const, name: t('endpoints.public', 'Anyone with the address') }] : []),
    ...(kind === 'https'
      ? [{ key: 'signed-in' as const, name: t('endpoints.signedIn', 'People who may connect, signed in') }]
      : []),
    { key: 'latch', name: t('endpoints.latchChoice', 'Its first user only') },
    { key: 'ip-locked', name: t('endpoints.ipLockedChoice', 'One address') },
    { key: 'cidr', name: t('endpoints.cidrChoice', 'Addresses I list') },
  ]
  const chosenAccess = accesses.some(a => a.key === access) ? access : accesses[0].key
  const usable = proxies.filter(p => p.publicEndpoints || chosenAccess !== 'public')

  return (
    <Box paddingX={2} paddingBottom={2}>
      <List disablePadding>
        <SelectSetting
          icon="server"
          label={t('endpoints.proxy', 'Proxy')}
          value={proxyId}
          values={[
            { key: '', name: t('endpoints.nearest', "remote.it's, nearest the device") },
            ...usable.map(p => ({
              key: p.id,
              name: p.kind === 'own' ? p.host : `${p.host}${p.region ? ` (${p.region})` : ''}`,
            })),
          ]}
          onChange={setProxyId}
        />
        <SelectSetting
          icon="plug"
          label={t('endpoints.kind', 'Kind')}
          value={kind}
          values={[
            { key: 'https', name: t('endpoints.https', 'HTTPS — a name') },
            { key: 'tcp', name: t('endpoints.tcp', 'TCP — a port') },
            { key: 'udp', name: t('endpoints.udp', 'UDP — a port') },
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
            { key: 'temporary', name: t('endpoints.temporaryChoice', 'Temporary — released after 15 idle minutes') },
            { key: 'permanent', name: t('endpoints.permanentChoice', 'Permanent — kept until removed') },
          ]}
          helpMessage={t('endpoints.lifetimeHelp', 'Chosen now: an endpoint is not made permanent later.')}
          onChange={value => setLifetime(value as EndpointLifetime)}
        />
      </List>
      {chosenAccess === 'ip-locked' && (
        <TextField
          fullWidth
          size="small"
          label={t('endpoints.lockedIp', 'The address allowed')}
          value={lockedIp}
          onChange={event => setLockedIp(event.target.value.trim())}
          sx={{ marginTop: 1 }}
        />
      )}
      {chosenAccess === 'cidr' && (
        <TextField
          fullWidth
          size="small"
          label={t('endpoints.allow', 'Addresses allowed, as 203.0.113.0/24, comma separated')}
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
            proxyId: proxyId || undefined,
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
        {t('endpoints.create', 'Make the endpoint')}
      </Button>
    </Box>
  )
}
