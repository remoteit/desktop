import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  Box,
  Button,
  Checkbox,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  ListSubheader,
  MenuItem,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import {
  DeviceNetwork,
  NetworkDeviceRole,
  NetworkMember,
  graphQLAddNetworkDevice,
  graphQLListNetworkService,
  graphQLRemoveNetworkDevice,
  initiates,
  targeted,
} from '../services/graphQLDeviceNetworks'
import { getAllDevices } from '../selectors/devices'
import { useDeviceNetworks } from '../hooks/useDeviceNetworks'
import { useDeviceSessionInfo } from '../hooks/useDeviceSessionInfo'
import { ListItemLocation } from '../components/ListItemLocation'
import { LoadingMessage } from '../components/LoadingMessage'
import { ListItemSetting } from '../components/ListItemSetting'
import { IconButton } from '../buttons/IconButton'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { Icon } from '../components/Icon'
import { DeviceNetworkGraph } from '../components/DeviceNetworkGraph'

const ROLES: NetworkDeviceRole[] = ['INITIATOR', 'TARGET', 'BOTH']

/* A network of devices (docs/superpowers/specs/2026-09-30-device-sessions-ui-design.md §3): its initiators, its
   targets and what each exposes — the services the network lists, all of them, any port of its own — the people who
   may connect to it (who reach what its targets expose, as initiators do) with their devices in user mode, and its tag
   rules. A device joins only when you manage both it and the network. In place of the network page while the
   device-sessions flag is on. */
export const DeviceNetworkPage: React.FC = () => {
  const { t } = useTranslation()
  const { networkID } = useParams<{ networkID?: string }>()
  const { networks, reload } = useDeviceNetworks()
  const devices = useSelector(getAllDevices)
  const [busy, setBusy] = useState(false)
  const [view, setView] = useState<'list' | 'graph'>('list')

  const network = Array.isArray(networks) ? networks.find(n => n.id === networkID) : undefined
  if (networks === undefined) return <LoadingMessage />
  if (!network)
    return (
      <Container gutterBottom header={<Typography variant="h1">{t('deviceNetwork.title', 'Network')}</Typography>}>
        <Gutters>
          <Notice severity="info" fullWidth>
            {t('deviceNetwork.none', 'No such network, or it is not shown on this API.')}
          </Notice>
        </Gutters>
      </Container>
    )

  const manage = network.permissions.includes('MANAGE')
  const link = network.kind === 'LINK'
  const deviceById = new Map(devices.map(device => [device.id, device]))
  const nameOf = (id: string) => deviceById.get(id)?.name || id
  const listed = new Set(network.connections.map(connection => connection.service.id))

  const act = async (change: () => Promise<unknown>) => {
    setBusy(true)
    await change()
    await reload()
    setBusy(false)
  }
  const change = (member: NetworkMember, set: Partial<NetworkMember>) =>
    act(() =>
      graphQLAddNetworkDevice(network.id, member.deviceId, {
        role: set.role ?? member.role,
        scope: set.scope ?? member.scope,
        anyPort: set.anyPort ?? member.anyPort,
      })
    )

  const exposure = (member: NetworkMember) => {
    const parts = [
      member.scope === 'ALL'
        ? t('deviceNetwork.allServices', 'All services')
        : t('deviceNetwork.listedServices', '{{count}} listed services', {
            count: (deviceById.get(member.deviceId)?.services || []).filter(s => listed.has(s.id)).length,
          }),
    ]
    if (member.anyPort) parts.push(t('deviceNetwork.anyPort', 'Any port'))
    return parts.join(' · ')
  }

  const initiators = network.devices.filter(initiates)
  const targets = network.devices.filter(targeted)
  const people = [{ ...network.owner, manages: true }, ...network.access.map(a => ({ ...a.user, manages: false }))]

  return (
    <Container
      gutterBottom
      bodyProps={{ verticalOverflow: true }}
      header={
        <Typography variant="h1">
          <Title>{network.name}</Title>
          {link && <Chip size="small" label={t('deviceNetwork.link', 'Link')} sx={{ marginLeft: 1 }} />}
          <ToggleButtonGroup
            size="small"
            exclusive
            value={view}
            onChange={(_, value) => value && setView(value)}
            sx={{ marginLeft: 'auto' }}
          >
            <ToggleButton value="list">{t('deviceNetwork.list', 'List')}</ToggleButton>
            <ToggleButton value="graph">{t('deviceNetwork.graph', 'Graph')}</ToggleButton>
          </ToggleButtonGroup>
        </Typography>
      }
    >
      {view === 'graph' ? (
        <Gutters>
          <DeviceNetworkGraph network={network} devices={devices} manage={manage} exposure={exposure} act={act} />
        </Gutters>
      ) : (
        <>
          <List>
            <ListSubheader>{t('deviceNetwork.initiators', 'Initiating devices')}</ListSubheader>
            {!initiators.length && (
              <Empty text={t('deviceNetwork.noInitiators', 'No device initiates on this network')} />
            )}
            {initiators.map(member => (
              <MemberItem
                key={member.deviceId}
                name={nameOf(member.deviceId)}
                member={member}
                detail={member.role === 'BOTH' ? t('deviceNetwork.alsoTarget', 'Also a target') : undefined}
                removable={manage && !busy}
                onRemove={() => act(() => graphQLRemoveNetworkDevice(network.id, member.deviceId))}
              />
            ))}
          </List>

          <List>
            <ListSubheader>{t('deviceNetwork.targets', 'Target devices')}</ListSubheader>
            {!targets.length && <Empty text={t('deviceNetwork.noTargets', 'No device is a target on this network')} />}
            {targets.map(member => (
              <Box key={member.deviceId}>
                <MemberItem
                  name={nameOf(member.deviceId)}
                  member={member}
                  detail={exposure(member)}
                  removable={manage && !busy}
                  onRemove={() => act(() => graphQLRemoveNetworkDevice(network.id, member.deviceId))}
                />
                {manage && !link && (
                  <Box sx={{ paddingLeft: 6 }}>
                    <ListItemSetting
                      hideIcon
                      size="small"
                      label={t('deviceNetwork.allServices', 'All services')}
                      subLabel={t('deviceNetwork.allServicesHint', 'Every service it has, including ones added later')}
                      toggle={member.scope === 'ALL'}
                      disabled={busy}
                      onClick={() => change(member, { scope: member.scope === 'ALL' ? 'LISTED' : 'ALL' })}
                    />
                    <ListItemSetting
                      hideIcon
                      size="small"
                      label={t('deviceNetwork.anyPort', 'Any port')}
                      subLabel={t(
                        'deviceNetwork.anyPortHint',
                        "Any port of the device itself, within its Any port setting (the device's Configure page)"
                      )}
                      toggle={member.anyPort}
                      disabled={busy}
                      onClick={() => change(member, { anyPort: !member.anyPort })}
                    />
                    {member.scope === 'LISTED' &&
                      (deviceById.get(member.deviceId)?.services || []).map(service => (
                        <ListItem key={service.id} dense disableGutters>
                          <ListItemIcon>
                            <Checkbox
                              size="small"
                              checked={listed.has(service.id)}
                              disabled={busy}
                              onChange={() =>
                                act(() => graphQLListNetworkService(network.id, service.id, !listed.has(service.id)))
                              }
                            />
                          </ListItemIcon>
                          <ListItemText primary={service.name} />
                        </ListItem>
                      ))}
                  </Box>
                )}
              </Box>
            ))}
          </List>

          <List>
            <ListSubheader>
              {t('deviceNetwork.people', 'People')}
              {manage && (
                <IconButton
                  icon="user-plus"
                  title={t('deviceNetwork.share', 'Share the network')}
                  to={`/networks/${network.id}/share`}
                  size="sm"
                />
              )}
            </ListSubheader>
            {people.map(person => (
              <Box key={person.id}>
                <ListItem dense>
                  <ListItemIcon>
                    <Icon name="user" />
                  </ListItemIcon>
                  <ListItemText
                    primary={person.email}
                    secondary={
                      person.manages
                        ? t('deviceNetwork.owner', 'Owner: manages it, and reaches what its targets expose')
                        : t('deviceNetwork.connects', 'Reaches what its targets expose')
                    }
                  />
                </ListItem>
                <UserModeDevices email={person.email} devices={devices} />
              </Box>
            ))}
          </List>

          {!!network.deviceRules.length && (
            <List>
              <ListSubheader>{t('deviceNetwork.rules', 'Tag rules')}</ListSubheader>
              {network.deviceRules.map(rule => (
                <ListItem key={rule.role} dense>
                  <ListItemText
                    primary={t('deviceNetwork.rule', 'Devices tagged {{tags}} are {{role}}', {
                      tags: rule.tags.join(rule.operator === 'ALL' ? ' and ' : ' or '),
                      role: roleLabel(t, rule.role),
                    })}
                    secondary={
                      targeted(rule)
                        ? rule.scope === 'ALL'
                          ? t('deviceNetwork.allServices', 'All services')
                          : t('deviceNetwork.listed', 'Listed services')
                        : undefined
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}

          {manage && !link && <AddDevice network={network} devices={devices} busy={busy} act={act} />}
        </>
      )}
    </Container>
  )
}

const roleLabel = (t: (key: string, fallback: string) => string, role: NetworkDeviceRole) =>
  role === 'INITIATOR'
    ? t('deviceNetwork.roleInitiator', 'Initiator')
    : role === 'TARGET'
    ? t('deviceNetwork.roleTarget', 'Target')
    : t('deviceNetwork.roleBoth', 'Initiator and target')

const Empty: React.FC<{ text: string }> = ({ text }) => (
  <ListItem dense>
    <ListItemText secondary={text} />
  </ListItem>
)

const MemberItem: React.FC<{
  name: string
  member: NetworkMember
  detail?: string
  removable: boolean
  onRemove: () => void
}> = ({ name, member, detail, removable, onRemove }) => {
  const { t } = useTranslation()
  return (
    <ListItemLocation to={`/devices/${member.deviceId}`} icon="hdd" dense>
      <ListItemText primary={name} secondary={detail} />
      {removable && (
        <ListItemSecondaryAction>
          <IconButton
            icon="times"
            title={t('deviceNetwork.remove', 'Remove from the network')}
            size="sm"
            onClick={event => {
              event.stopPropagation()
              onRemove()
            }}
          />
        </ListItemSecondaryAction>
      )}
    </ListItemLocation>
  )
}

// A person's devices in user mode: full access — they reach everything the person can, not only this network.
const UserModeDevices: React.FC<{ email: string; devices: IDevice[] }> = ({ email, devices }) => (
  <>
    {devices.map(device => (
      <UserModeDevice key={device.id} device={device} email={email} />
    ))}
  </>
)

const UserModeDevice: React.FC<{ device: IDevice; email: string }> = ({ device, email }) => {
  const { t } = useTranslation()
  const info = useDeviceSessionInfo(device.id)
  if (info?.actsFor !== email) return null
  return (
    <ListItemLocation to={`/devices/${device.id}`} icon="laptop" inset={1.5} dense>
      <ListItemText primary={device.name} secondary={t('deviceNetwork.fullAccess', 'User mode: full access')} />
    </ListItemLocation>
  )
}

// A device you manage onto the network: its role, and — as a target — what it exposes.
const AddDevice: React.FC<{
  network: DeviceNetwork
  devices: IDevice[]
  busy: boolean
  act: (change: () => Promise<unknown>) => Promise<void>
}> = ({ network, devices, busy, act }) => {
  const { t } = useTranslation()
  const [deviceId, setDeviceId] = useState('')
  const [role, setRole] = useState<NetworkDeviceRole>('TARGET')
  const [all, setAll] = useState(true)
  const [anyPort, setAnyPort] = useState(false)
  const members = new Set(network.devices.map(member => member.deviceId))
  const choices = devices.filter(device => device.permissions.includes('MANAGE') && !members.has(device.id))

  return (
    <List>
      <ListSubheader>{t('deviceNetwork.addDevice', 'Add a device')}</ListSubheader>
      <Gutters>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            select
            size="small"
            label={t('deviceNetwork.device', 'Device')}
            value={deviceId}
            onChange={event => setDeviceId(event.target.value)}
            sx={{ minWidth: 220 }}
          >
            {choices.map(device => (
              <MenuItem key={device.id} value={device.id}>
                {device.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label={t('deviceNetwork.role', 'Role')}
            value={role}
            onChange={event => setRole(event.target.value as NetworkDeviceRole)}
            sx={{ minWidth: 180 }}
          >
            {ROLES.map(value => (
              <MenuItem key={value} value={value}>
                {roleLabel(t, value)}
              </MenuItem>
            ))}
          </TextField>
          <Button
            variant="contained"
            size="small"
            disabled={!deviceId || busy}
            onClick={() =>
              act(async () => {
                await graphQLAddNetworkDevice(network.id, deviceId, {
                  role,
                  scope: all ? 'ALL' : 'LISTED',
                  anyPort: role !== 'INITIATOR' && anyPort,
                })
                setDeviceId('')
              })
            }
          >
            {t('deviceNetwork.add', 'Add')}
          </Button>
        </Box>
      </Gutters>
      {role !== 'INITIATOR' && (
        <>
          <ListItemSetting
            hideIcon
            size="small"
            label={t('deviceNetwork.allServices', 'All services')}
            subLabel={t('deviceNetwork.allServicesAddHint', 'Off: only the services you list on the network')}
            toggle={all}
            onClick={() => setAll(!all)}
          />
          <ListItemSetting
            hideIcon
            size="small"
            label={t('deviceNetwork.anyPort', 'Any port')}
            subLabel={t('deviceNetwork.anyPortAddHint', "Needs the device's Any port setting on first")}
            toggle={anyPort}
            onClick={() => setAnyPort(!anyPort)}
          />
        </>
      )}
      {!choices.length && (
        <Gutters>
          <Typography variant="caption" color="textSecondary">
            {t('deviceNetwork.noChoices', 'Only devices you manage can be added.')}
          </Typography>
        </Gutters>
      )}
    </List>
  )
}
