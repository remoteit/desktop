import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  Autocomplete,
  Box,
  Button,
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
  graphQLRemoveNetworkDeviceRule,
  graphQLSetNetworkDeviceRule,
  exposes,
  initiates,
  roleFor,
  targeted,
} from '../services/graphQLDeviceNetworks'
import { getAllDevices } from '../selectors/devices'
import { selectTags } from '../selectors/tags'
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

/* A network of devices (docs/superpowers/specs/2026-09-30-device-sessions-ui-design.md §3): its devices, each an
   initiator (a switch) and a target as soon as it exposes something — all its services, any port of its own, or
   services chosen one by one — the people who may connect to it (who reach what its targets expose, as initiators
   do) with their devices in user mode, and its tag rules. A device is added with + and set up in place; one joins only
   when you manage both it and the network. In place of the network page while the device-sessions flag is on. */
export const DeviceNetworkPage: React.FC = () => {
  const { t } = useTranslation()
  const { networkID } = useParams<{ networkID?: string }>()
  const { networks, reload } = useDeviceNetworks()
  const devices = useSelector(getAllDevices)
  const [busy, setBusy] = useState(false)
  const [view, setView] = useState<'list' | 'graph'>('list')
  const [adding, setAdding] = useState(false)

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
  // The services of a member the network lists.
  const listedOf = (member: NetworkMember) =>
    network.connections.filter(connection => connection.service.device?.id === member.deviceId).length

  // A member's choices, saved with the role they make: an initiator when switched on, a target when it exposes
  // something (all services, any port, or a listed service).
  const change = (
    member: NetworkMember,
    set: { initiator?: boolean; scope?: NetworkMember['scope']; anyPort?: boolean }
  ) => {
    const scope = set.scope ?? member.scope
    const anyPort = set.anyPort ?? (targeted(member) && member.anyPort)
    const initiator = set.initiator ?? initiates(member)
    const exposing = scope === 'ALL' || anyPort || (targeted(member) && listedOf(member) > 0)
    return act(() =>
      graphQLAddNetworkDevice(network.id, member.deviceId, { role: roleFor(initiator, exposing), scope, anyPort })
    )
  }
  // A service listed or not; the member becomes a target with its first, and stops being one with its last.
  const list = (member: NetworkMember, serviceId: string) =>
    act(async () => {
      const listing = !listed.has(serviceId)
      await graphQLListNetworkService(network.id, serviceId, listing)
      // What it exposes now, as a target: an initiator's stored scope and any port do not count.
      const all = targeted(member) && member.scope === 'ALL'
      const anyPort = targeted(member) && member.anyPort
      const exposing = all || anyPort || listedOf(member) + (listing ? 1 : -1) > 0
      const role = roleFor(initiates(member), exposing)
      if (role !== member.role)
        await graphQLAddNetworkDevice(network.id, member.deviceId, { role, scope: all ? 'ALL' : 'LISTED', anyPort })
    })

  // A target exposing all its services — All services, or Any port, which takes them all with it.
  const allOn = (member: NetworkMember) => targeted(member) && (member.scope === 'ALL' || member.anyPort)
  const servicesOf = (member: NetworkMember) => deviceById.get(member.deviceId)?.services || []

  // All services off: every service unlisted, and any port off with it.
  const setAll = (member: NetworkMember, on: boolean) =>
    on
      ? change(member, { scope: 'ALL' })
      : act(async () => {
          for (const service of servicesOf(member))
            if (listed.has(service.id)) await graphQLListNetworkService(network.id, service.id, false)
          await graphQLAddNetworkDevice(network.id, member.deviceId, {
            role: roleFor(initiates(member), false),
            scope: 'LISTED',
            anyPort: false,
          })
        })
  // Any port on takes all services with it; off leaves them.
  const setAnyPort = (member: NetworkMember, on: boolean) =>
    change(member, on ? { scope: 'ALL', anyPort: true } : { anyPort: false })
  // A service on or off. Off while all are on: the rest are listed one by one, and All services and Any port go off.
  const setService = (member: NetworkMember, serviceId: string) => {
    if (!allOn(member)) return list(member, serviceId)
    return act(async () => {
      const rest = servicesOf(member).filter(service => service.id !== serviceId)
      for (const service of rest)
        if (!listed.has(service.id)) await graphQLListNetworkService(network.id, service.id, true)
      if (listed.has(serviceId)) await graphQLListNetworkService(network.id, serviceId, false)
      await graphQLAddNetworkDevice(network.id, member.deviceId, {
        role: roleFor(initiates(member), rest.length > 0),
        scope: 'LISTED',
        anyPort: false,
      })
    })
  }

  // What a member is: an initiator, a target exposing what, or nothing chosen yet.
  const exposure = (member: NetworkMember) => {
    if (!exposes(network, member)) return t('deviceNetwork.exposesNothing', 'Exposes nothing')
    const parts = [
      allOn(member)
        ? t('deviceNetwork.allServices', 'All services')
        : t('deviceNetwork.listedServices', '{{count}} of {{total}} services', {
            count: listedOf(member),
            total: servicesOf(member).length,
          }),
    ]
    if (member.anyPort) parts.push(t('deviceNetwork.anyPort', 'Any port'))
    return parts.join(' · ')
  }
  const summary = (member: NetworkMember) => {
    const parts: string[] = []
    if (initiates(member)) parts.push(t('deviceNetwork.initiator', 'Initiator'))
    if (exposes(network, member))
      parts.push(t('deviceNetwork.targetExposing', 'Target: {{what}}', { what: exposure(member) }))
    return parts.length ? parts.join(' · ') : t('deviceNetwork.nothingChosen', 'Nothing chosen yet')
  }

  const addable = devices.filter(
    device => device.permissions.includes('MANAGE') && !network.devices.some(member => member.deviceId === device.id)
  )
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
            <ListSubheader>
              {t('deviceNetwork.devices', 'Devices')}
              {manage && !link && (
                <IconButton
                  icon="plus"
                  title={t('deviceNetwork.addDevice', 'Add a device')}
                  size="sm"
                  disabled={busy}
                  onClick={() => setAdding(!adding)}
                />
              )}
            </ListSubheader>
            {adding && (
              <Gutters>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label={t('deviceNetwork.chooseDevice', 'Device to add')}
                  value=""
                  helperText={
                    !addable.length ? t('deviceNetwork.noChoices', 'Only devices you manage can be added.') : undefined
                  }
                  onChange={event => {
                    const deviceId = event.target.value
                    setAdding(false)
                    // Added exposing nothing and initiating nothing: its choices are made here, in place.
                    act(() =>
                      graphQLAddNetworkDevice(network.id, deviceId, { role: 'TARGET', scope: 'LISTED', anyPort: false })
                    )
                  }}
                >
                  {addable.map(device => (
                    <MenuItem key={device.id} value={device.id}>
                      {device.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Gutters>
            )}
            {!network.devices.length && <Empty text={t('deviceNetwork.noDevices', 'No devices on this network yet')} />}
            {[...network.devices]
              .sort((a, b) => nameOf(a.deviceId).localeCompare(nameOf(b.deviceId)))
              .map(member => (
                <MemberRow
                  key={member.deviceId}
                  name={nameOf(member.deviceId)}
                  member={member}
                  services={servicesOf(member)}
                  listed={listed}
                  allOn={allOn(member)}
                  summary={summary(member)}
                  editable={manage && !link && !busy}
                  onInitiator={() => change(member, { initiator: !initiates(member) })}
                  onAll={() => setAll(member, !allOn(member))}
                  onAnyPort={() => setAnyPort(member, !(targeted(member) && member.anyPort))}
                  onService={serviceId => setService(member, serviceId)}
                  onRemove={() => act(() => graphQLRemoveNetworkDevice(network.id, member.deviceId))}
                />
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

          <TagRules network={network} busy={busy} act={act} />
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

// Shown in place up to this many services; past it, the first SHOWN and a count, with a filter past FILTER.
const INLINE = 8
const SHOWN = 6
const FILTER = 10

/* A device on the network, in two rows of chips: Initiator, All services and Any port, then its services in their own
   order — highlighted when exposed, all of them when All services or Any port is on. A long list folds to its first
   few and "+N more"; open, it can be filtered. */
const MemberRow: React.FC<{
  name: string
  member: NetworkMember
  services: IService[]
  listed: Set<string>
  allOn: boolean
  summary: string
  editable: boolean
  onInitiator: () => void
  onAll: () => void
  onAnyPort: () => void
  onService: (serviceId: string) => void
  onRemove: () => void
}> = ({ name, member, services, listed, allOn, summary, editable, ...on }) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const exposed = (service: IService) => allOn || (targeted(member) && listed.has(service.id))
  const toggle = (label: React.ReactNode, active: boolean, onClick?: () => void, dashed?: boolean) => (
    <Chip
      size="small"
      label={label}
      color={active ? 'primary' : 'default'}
      variant={active ? 'filled' : 'outlined'}
      onClick={editable ? onClick : undefined}
      sx={dashed ? { borderStyle: 'dashed' } : undefined}
    />
  )

  const folded = services.length > INLINE && !open
  const hidden = folded ? services.slice(SHOWN) : []
  const shown = folded
    ? services.slice(0, SHOWN)
    : services.filter(s => s.name.toLowerCase().includes(filter.toLowerCase()))

  return (
    <Box sx={{ paddingX: 2, paddingY: 1, borderTop: 1, borderColor: 'grayLighter.main' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <ListItemLocation to={`/devices/${member.deviceId}`} icon="hdd" dense sx={{ flex: '0 0 auto', minWidth: 200 }}>
          <ListItemText primary={name} />
        </ListItemLocation>
        {toggle(t('deviceNetwork.initiatorToggle', 'Initiator'), initiates(member), on.onInitiator)}
        <Typography variant="caption" color="textSecondary">
          ·
        </Typography>
        {toggle(t('deviceNetwork.allServices', 'All services'), allOn, on.onAll)}
        {toggle(t('deviceNetwork.anyPort', 'Any port'), targeted(member) && member.anyPort, on.onAnyPort)}
        <Box sx={{ marginLeft: 'auto' }}>
          {editable && (
            <IconButton
              icon="times"
              title={t('deviceNetwork.remove', 'Remove from the network')}
              size="sm"
              onClick={on.onRemove}
            />
          )}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'center', marginTop: 1, paddingLeft: 7 }}>
        {open && services.length > FILTER && (
          <TextField
            size="small"
            fullWidth
            placeholder={t('deviceNetwork.filterServices', 'Filter {{count}} services', { count: services.length })}
            value={filter}
            onChange={event => setFilter(event.target.value)}
          />
        )}
        {folded && allOn
          ? toggle(t('deviceNetwork.allCount', 'All {{count}} services', { count: services.length }), true, () =>
              setOpen(true)
            )
          : shown.map(service => (
              <React.Fragment key={service.id}>
                {toggle(service.name, exposed(service), () => on.onService(service.id))}
              </React.Fragment>
            ))}
        {folded &&
          !allOn &&
          toggle(
            hidden.some(exposed)
              ? t('deviceNetwork.moreSelected', '+{{count}} more · {{selected}} selected', {
                  count: hidden.length,
                  selected: hidden.filter(exposed).length,
                })
              : t('deviceNetwork.more', '+{{count}} more', { count: hidden.length }),
            false,
            () => setOpen(true),
            true
          )}
        {open && services.length > INLINE && (
          <Typography
            variant="caption"
            color="primary"
            sx={{ cursor: 'pointer' }}
            onClick={() => {
              setOpen(false)
              setFilter('')
            }}
          >
            {t('deviceNetwork.showLess', 'Show less')}
          </Typography>
        )}
      </Box>
      <Typography variant="caption" color="textSecondary" component="div" sx={{ marginTop: 0.5, paddingLeft: 7 }}>
        {summary}
      </Typography>
    </Box>
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

// A network's membership by tag, one rule per role: the owner's devices carrying any (or all) of the tags take the
// role, joining and leaving as they gain and lose them. Shown to anyone who sees the network; set by the owning
// account's administrators.
const TagRules: React.FC<{
  network: DeviceNetwork
  busy: boolean
  act: (change: () => Promise<unknown>) => Promise<void>
}> = ({ network, busy, act }) => {
  const { t } = useTranslation()
  const tags = useSelector(selectTags)
  const admin = network.permissions.includes('ADMIN') && network.kind !== 'LINK'
  const [role, setRole] = useState<NetworkDeviceRole>('TARGET')
  const [chosen, setChosen] = useState<string[]>([])
  const [operator, setOperator] = useState<'ANY' | 'ALL'>('ANY')
  const [all, setAll] = useState(true)

  if (!admin && !network.deviceRules.length) return null

  return (
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
          {admin && (
            <ListItemSecondaryAction>
              <IconButton
                icon="times"
                title={t('deviceNetwork.removeRule', 'Remove the rule')}
                size="sm"
                disabled={busy}
                onClick={() => act(() => graphQLRemoveNetworkDeviceRule(network.id, rule.role))}
              />
            </ListItemSecondaryAction>
          )}
        </ListItem>
      ))}
      {admin && (
        <Gutters>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Autocomplete
              multiple
              size="small"
              options={tags.map(tag => tag.name)}
              value={chosen}
              onChange={(_, value) => setChosen(value)}
              renderInput={params => <TextField {...params} label={t('deviceNetwork.ruleTags', 'Tags')} />}
              sx={{ minWidth: 220 }}
            />
            <TextField
              select
              size="small"
              label={t('deviceNetwork.ruleOperator', 'Match')}
              value={operator}
              onChange={event => setOperator(event.target.value as 'ANY' | 'ALL')}
            >
              <MenuItem value="ANY">{t('deviceNetwork.ruleAny', 'Any of them')}</MenuItem>
              <MenuItem value="ALL">{t('deviceNetwork.ruleAll', 'All of them')}</MenuItem>
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
              disabled={!chosen.length || busy}
              onClick={() =>
                act(async () => {
                  await graphQLSetNetworkDeviceRule(network.id, {
                    role,
                    tags: chosen,
                    operator,
                    scope: role === 'INITIATOR' ? undefined : all ? 'ALL' : 'LISTED',
                  })
                  setChosen([])
                })
              }
            >
              {t('deviceNetwork.setRule', 'Set rule')}
            </Button>
          </Box>
          {role !== 'INITIATOR' && (
            <ListItemSetting
              hideIcon
              size="small"
              label={t('deviceNetwork.allServices', 'All services')}
              subLabel={t('deviceNetwork.allServicesAddHint', 'Off: only the services you list on the network')}
              toggle={all}
              onClick={() => setAll(!all)}
            />
          )}
          <Typography variant="caption" color="textSecondary">
            {t('deviceNetwork.ruleHint', "One rule per role: setting a role's rule replaces it.")}
          </Typography>
        </Gutters>
      )}
    </List>
  )
}
