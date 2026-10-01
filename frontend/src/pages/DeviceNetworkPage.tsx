import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListSubheader,
  MenuItem,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import {
  NetworkMember,
  graphQLAddNetworkDevice,
  graphQLListNetworkService,
  graphQLRemoveNetworkDevice,
  graphQLCreateNetworkDeviceRule,
  graphQLRemoveNetworkDeviceRule,
  graphQLUpdateNetworkDeviceRule,
  NetworkRule,
  RuleChoices,
  graphQLSetNetworkShareRole,
  ShareRole,
  exposes,
  initiates,
  roleFor,
  targeted,
} from '../services/graphQLDeviceNetworks'
import { getAllDevices } from '../selectors/devices'
import { selectTags } from '../selectors/tags'
import { useLabel } from '../hooks/useLabel'
import { useDeviceNetworks } from '../hooks/useDeviceNetworks'
import { graphQLRemoveNetworkShare } from '../services/graphQLMutation'
import { LoadingMessage } from '../components/LoadingMessage'
import { IconButton } from '../buttons/IconButton'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { Icon } from '../components/Icon'
import { DeviceNetworkGraph } from '../components/DeviceNetworkGraph'

/* A network of devices (docs/superpowers/specs/2026-09-30-device-sessions-ui-design.md §3): its devices, each an
   initiator (a switch) and a target as soon as it exposes something — all its services, any port of its own, or
   services chosen one by one — the people who may connect to it (who reach what its targets expose, as initiators
   do) with their devices in user mode, and its devices by tag — the owner's, or another account's you administer. A device is added with + and set up in place; one joins only
   when you manage both it and the network. In place of the network page while the device-sessions flag is on. */
export const DeviceNetworkPage: React.FC = () => {
  const { t } = useTranslation()
  const { networkID } = useParams<{ networkID?: string }>()
  const { networks, reload } = useDeviceNetworks()
  const devices = useSelector(getAllDevices)
  const [busy, setBusy] = useState(false)
  const [view, setView] = useState<'list' | 'graph'>('list')
  const [adding, setAdding] = useState<'device' | 'tag' | false>(false)
  const tags = useSelector(selectTags)

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
  // Devices by tag select among all the owner's devices: its account's administrators set them.
  const admin = network.permissions.includes('ADMIN')
  const link = network.kind === 'LINK'
  const deviceById = new Map(devices.map(device => [device.id, device]))
  const nameOf = (id: string) =>
    deviceById.get(id)?.name || network.devices.find(member => member.deviceId === id)?.name || id
  const listed = new Set(network.connections.map(connection => connection.service.id))
  // The accounts whose devices you may add by tag: the owner's, and others you administer.
  const ruleAccounts = network.ruleAccounts || []

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
  // The devices added one by one, by the account they come from: the network owner's first, then each other one.
  const byAccount = Object.values(
    network.devices.reduce<Record<string, { accountId: string; accountName: string; members: NetworkMember[] }>>(
      (groups, member) => {
        const accountId = member.accountId || network.owner.id
        groups[accountId] ??= { accountId, accountName: member.accountName || accountId, members: [] }
        groups[accountId].members.push(member)
        return groups
      },
      {}
    )
  )
    .map(group => ({
      ...group,
      members: group.members.sort((a, b) => nameOf(a.deviceId).localeCompare(nameOf(b.deviceId))),
    }))
    .sort((a, b) =>
      a.accountId === network.owner.id
        ? -1
        : b.accountId === network.owner.id
        ? 1
        : a.accountName.localeCompare(b.accountName)
    )
  const people = [
    { ...network.owner, owner: true, role: 'MANAGE' as ShareRole },
    ...network.access.map(a => ({ ...a.user, owner: false, role: a.role || ('CONNECT' as ShareRole) })),
  ]

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
                  onClick={() => setAdding(adding === 'device' ? false : 'device')}
                />
              )}
              {!!ruleAccounts.length && !link && (
                <IconButton
                  icon="tag"
                  title={t('deviceNetwork.addByTag', 'Add devices by tag')}
                  size="sm"
                  disabled={busy}
                  onClick={() => setAdding(adding === 'tag' ? false : 'tag')}
                />
              )}
            </ListSubheader>
            {adding === 'tag' && (
              <Gutters>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label={t('deviceNetwork.chooseTag', 'Devices tagged')}
                  value=""
                  helperText={
                    !ruleAccounts.some(account => account.tags.length)
                      ? t('deviceNetwork.noTags', 'Tag devices first.')
                      : t('deviceNetwork.oneAccount', "A group takes one account's tags")
                  }
                  onChange={event => {
                    const [accountId, tag] = String(event.target.value).split('\n')
                    setAdding(false)
                    // A group starts with its tag and nothing chosen: its choices are made on its heading.
                    act(() =>
                      graphQLCreateNetworkDeviceRule(network.id, {
                        tags: [tag],
                        accountId: accountId === network.owner.id ? undefined : accountId,
                      })
                    )
                  }}
                >
                  {ruleAccounts
                    .filter(account => account.tags.length)
                    .flatMap(account => [
                      <ListSubheader key={account.id}>{account.name}</ListSubheader>,
                      ...account.tags.map(tag => (
                        <MenuItem key={`${account.id}/${tag}`} value={`${account.id}\n${tag}`}>
                          {tag}
                        </MenuItem>
                      )),
                    ])}
                </TextField>
              </Gutters>
            )}
            {(network.deviceRules || []).map(rule => (
              <TagGroup
                key={rule.id}
                rule={rule}
                tags={rule.accountId === network.owner.id ? tags : []}
                choices={ruleAccounts.find(account => account.id === rule.accountId)?.tags || []}
                foreign={rule.accountId !== network.owner.id}
                deviceById={deviceById}
                editable={rule.editable && !link && !busy}
                removable={admin && !link && !busy}
                onChange={set => act(() => graphQLUpdateNetworkDeviceRule(rule.id, set))}
                onRemove={() => act(() => graphQLRemoveNetworkDeviceRule(rule.id))}
              />
            ))}
            {adding === 'device' && (
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
            {!network.devices.length && !(network.deviceRules || []).length && (
              <Empty text={t('deviceNetwork.noDevices', 'No devices on this network yet')} />
            )}
            {byAccount.map(group => (
              <React.Fragment key={group.accountId}>
                <Box
                  sx={{
                    paddingX: 2,
                    paddingY: 1,
                    borderTop: 1,
                    borderColor: 'grayLighter.main',
                    bgcolor: 'grayLightest.main',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Icon name="laptop" size="sm" color="grayDark" />
                    <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                      {group.accountName}
                    </Typography>
                    {group.accountId === network.owner.id && (
                      <Typography variant="caption" color="textSecondary" noWrap>
                        · {t('deviceNetwork.thisNetworks', "this network's")}
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="caption" color="textSecondary" component="div" sx={{ paddingLeft: TAG_INDENT }}>
                    {t('deviceNetwork.oneByOne', 'Added one by one')} ·{' '}
                    {group.members.length === 1
                      ? t('deviceNetwork.groupDevice', '1 device')
                      : t('deviceNetwork.groupDevices', '{{count}} devices', { count: group.members.length })}
                  </Typography>
                </Box>
                {group.members.map(member => (
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
              </React.Fragment>
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
              <PersonRow
                key={person.id}
                email={person.email}
                owner={person.owner}
                role={person.role}
                devices={(network.userModeDevices || []).filter(device => device.userId === person.id)}
                editable={manage && !person.owner && !busy}
                onRole={role => act(() => graphQLSetNetworkShareRole(network.id, person.email, role))}
                onRemove={() => act(() => graphQLRemoveNetworkShare(network.id, person.email))}
              />
            ))}
          </List>
        </>
      )}
    </Container>
  )
}

const Empty: React.FC<{ text: string }> = ({ text }) => (
  <ListItem dense>
    <ListItemText secondary={text} />
  </ListItem>
)

// Shown in place up to this many services; past it, the first SHOWN and a count, with a filter past FILTER.
const INLINE = 8
const SHOWN = 6
const FILTER = 10
// The device's name, with what it is under it, beside its chips.
const NAME_WIDTH = 180

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
    <Box sx={{ display: 'flex', gap: 1, paddingX: 2, paddingY: 1, borderTop: 1, borderColor: 'grayLighter.main' }}>
      <Box sx={{ width: NAME_WIDTH, flex: '0 0 auto', minWidth: 0, paddingTop: 0.25 }}>
        <Typography variant="body2" noWrap sx={{ fontWeight: 500 }} title={name}>
          {name}
        </Typography>
        <Typography variant="caption" color="textSecondary" component="div">
          {summary}
        </Typography>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
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
        <Box
          sx={{
            display: 'flex',
            gap: 0.75,
            flexWrap: 'wrap',
            alignItems: 'center',
            marginTop: 1,
          }}
        >
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
      </Box>
    </Box>
  )
}

/* A person the network is shared with, or its owner, beside the devices they have in user mode — full access: those
   reach everything the person can, this network's targets with the rest. The pills show; they do nothing. Past 8, the
   first 6 and "+N more". Removing a person unshares the network with them; its owner stays. */
const PersonRow: React.FC<{
  email: string
  owner: boolean
  role: ShareRole
  devices: { deviceId: string; name: string }[]
  editable: boolean
  onRole: (role: ShareRole) => void
  onRemove: () => void
}> = ({ email, owner, role, devices, editable, onRole, onRemove }) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const folded = devices.length > INLINE && !open
  const shown = folded ? devices.slice(0, SHOWN) : devices

  return (
    <Box sx={{ display: 'flex', gap: 1, paddingX: 2, paddingY: 1, borderTop: 1, borderColor: 'grayLighter.main' }}>
      <Box sx={{ width: NAME_WIDTH, flex: '0 0 auto', minWidth: 0, paddingTop: 0.25 }}>
        <Typography variant="body2" noWrap sx={{ fontWeight: 500 }} title={email}>
          {email}
        </Typography>
        <Typography variant="caption" color="textSecondary" component="div">
          {devices.length === 1
            ? t('deviceNetwork.deviceInUserMode', '1 device in user mode')
            : devices.length
            ? t('deviceNetwork.devicesInUserMode', '{{count}} devices in user mode', { count: devices.length })
            : t('deviceNetwork.noUserMode', 'No devices in user mode')}
        </Typography>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {/* What they may do, as words — not a pill, which here means a device. */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minHeight: 28 }}>
          <Icon name={owner ? 'crown' : role === 'MANAGE' ? 'sliders' : 'plug'} size="sm" color="grayDark" />
          {editable ? (
            <TextField
              select
              size="small"
              variant="standard"
              value={role}
              onChange={event => onRole(event.target.value as ShareRole)}
              InputProps={{ disableUnderline: true }}
              // Room for the arrow beside the words.
              SelectProps={{ sx: { paddingRight: '28px !important', fontSize: 14 } }}
            >
              <MenuItem value="CONNECT">{t('deviceNetwork.roleConnect', 'Can connect')}</MenuItem>
              <MenuItem value="MANAGE">{t('deviceNetwork.roleManage', 'Can manage')}</MenuItem>
            </TextField>
          ) : (
            <Typography variant="body2">
              {owner
                ? t('deviceNetwork.ownerRole', 'Owner · manages it')
                : role === 'MANAGE'
                ? t('deviceNetwork.roleManage', 'Can manage')
                : t('deviceNetwork.roleConnect', 'Can connect')}
            </Typography>
          )}
          <Box sx={{ marginLeft: 'auto' }}>
            {editable && (
              <IconButton
                icon="times"
                title={t('deviceNetwork.removePerson', 'Remove {{email}} from the network', { email })}
                size="sm"
                onClick={onRemove}
              />
            )}
          </Box>
        </Box>
        {!!devices.length && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', marginTop: 0.75 }}>
            {shown.map(device => (
              <Chip
                key={device.deviceId}
                size="small"
                color="primary"
                icon={<Icon name="laptop" size="xs" />}
                label={device.name}
              />
            ))}
            {folded && (
              <Chip
                size="small"
                variant="outlined"
                label={t('deviceNetwork.more', '+{{count}} more', { count: devices.length - SHOWN })}
                onClick={() => setOpen(true)}
                sx={{ borderStyle: 'dashed' }}
              />
            )}
            {open && devices.length > INLINE && (
              <Typography variant="caption" color="primary" sx={{ cursor: 'pointer' }} onClick={() => setOpen(false)}>
                {t('deviceNetwork.showLess', 'Show less')}
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Box>
  )
}

// Past this many matching devices, a group shows the first SHOWN and "+N more devices".
const GROUP_SHOWN = 6

/* Devices by tag: a heading — its tags (removable, and "+ tag" to add one), Initiator, All services, Any port, and Any
   tag / All tags when it has several — and a row for each device it makes a member, showing what the heading gives it
   (set on the heading, not per device). A device it matches but that is added on its own is a line saying so: its own
   row is what it is. Folds past GROUP_SHOWN devices. */
// The tags and summary sit under the account's name, in line with it past the tag icon.
const TAG_INDENT = 2.75

const TagGroup: React.FC<{
  rule: NetworkRule
  tags: ITag[] // the active account's, for colours: empty for another account's group
  choices: string[] // the tag names its account has, to add
  foreign: boolean // another account's devices, named on the heading
  deviceById: Map<string, IDevice>
  editable: boolean
  removable: boolean
  onChange: (set: RuleChoices) => void
  onRemove: () => void
}> = ({ rule, tags, choices, foreign, deviceById, editable, removable, onChange, onRemove }) => {
  const { t } = useTranslation()
  const getColor = useLabel()
  const [open, setOpen] = useState(false)
  const [picking, setPicking] = useState(false)
  const [filter, setFilter] = useState('')
  const colorOf = (name: string) =>
    getColor(rule.tagColors?.find(tag => tag.name === name)?.color ?? tags.find(tag => tag.name === name)?.color ?? 0)
  const nameOf = (id: string) => deviceById.get(id)?.name || rule.named?.find(device => device.id === id)?.name || id
  const target = rule.allServices || rule.anyPort
  const toggle = (label: React.ReactNode, active: boolean, onClick?: () => void) => (
    <Chip
      size="small"
      label={label}
      color={active ? 'primary' : 'default'}
      variant={active ? 'filled' : 'outlined'}
      onClick={editable ? onClick : undefined}
    />
  )
  const summary = [
    rule.initiator && t('deviceNetwork.groupInitiators', 'initiators'),
    rule.anyPort
      ? t('deviceNetwork.groupAnyPort', 'targets: all services · any port')
      : rule.allServices && t('deviceNetwork.groupAllServices', 'targets: all services'),
    rule.overridden.length &&
      (rule.overridden.length === 1
        ? t('deviceNetwork.groupOverriddenOne', '1 set on its own')
        : t('deviceNetwork.groupOverridden', '{{count}} set on their own', { count: rule.overridden.length })),
  ].filter(Boolean)
  const devices = [...rule.devices].sort((a, b) => nameOf(a).localeCompare(nameOf(b)))
  const folded = devices.length > GROUP_SHOWN && !open
  const shown = folded
    ? devices.slice(0, GROUP_SHOWN)
    : devices.filter(id => nameOf(id).toLowerCase().includes(filter.toLowerCase()))

  return (
    <Box sx={{ borderTop: 1, borderColor: 'grayLighter.main' }}>
      <Box sx={{ display: 'flex', gap: 1, paddingX: 2, paddingY: 1, bgcolor: 'grayLightest.main' }}>
        <Box sx={{ width: NAME_WIDTH + 40, flex: '0 0 auto', minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, marginBottom: 0.75 }}>
            <Icon name="tag" size="sm" color="grayDark" />
            <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
              {rule.accountName}
            </Typography>
            {!foreign && (
              <Typography variant="caption" color="textSecondary" noWrap>
                · {t('deviceNetwork.thisNetworks', "this network's")}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap', paddingLeft: TAG_INDENT }}>
            {rule.tags.map((tag, index) => (
              <React.Fragment key={tag}>
                {!!index && (
                  <Typography variant="caption" color="textSecondary">
                    {rule.operator === 'ALL' ? t('deviceNetwork.and', 'and') : t('deviceNetwork.or', 'or')}
                  </Typography>
                )}
                <Chip
                  size="small"
                  variant="outlined"
                  icon={
                    <Box
                      component="span"
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: colorOf(tag),
                        marginLeft: '8px !important',
                      }}
                    />
                  }
                  label={tag}
                  onDelete={
                    editable && rule.tags.length > 1
                      ? () => onChange({ tags: rule.tags.filter(name => name !== tag) })
                      : undefined
                  }
                />
              </React.Fragment>
            ))}
            {editable && (
              <Chip
                size="small"
                variant="outlined"
                label={t('deviceNetwork.addTag', '+ tag')}
                onClick={() => setPicking(!picking)}
                sx={{ borderStyle: 'dashed' }}
              />
            )}
          </Box>
          {picking && (
            <TextField
              select
              fullWidth
              size="small"
              value=""
              label={t('deviceNetwork.chooseTag', 'Devices tagged')}
              sx={{ marginTop: 1, paddingLeft: TAG_INDENT }}
              onChange={event => {
                setPicking(false)
                onChange({ tags: [...rule.tags, event.target.value] })
              }}
            >
              {choices
                .filter(tag => !rule.tags.includes(tag))
                .map(tag => (
                  <MenuItem key={tag} value={tag}>
                    {tag}
                  </MenuItem>
                ))}
            </TextField>
          )}
          <Typography
            variant="caption"
            color="textSecondary"
            component="div"
            sx={{ paddingLeft: TAG_INDENT, marginTop: 0.5 }}
          >
            {[
              rule.devices.length === 1
                ? t('deviceNetwork.groupDevice', '1 device')
                : t('deviceNetwork.groupDevices', '{{count}} devices', { count: rule.devices.length }),
              ...summary,
            ].join(' · ') || t('deviceNetwork.nothingChosen', 'Nothing chosen yet')}
          </Typography>
        </Box>
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap',
            alignSelf: 'flex-start',
          }}
        >
          {toggle(t('deviceNetwork.initiatorToggle', 'Initiator'), rule.initiator, () =>
            onChange({ initiator: !rule.initiator })
          )}
          <Typography variant="caption" color="textSecondary">
            ·
          </Typography>
          {toggle(t('deviceNetwork.allServices', 'All services'), rule.allServices || rule.anyPort, () =>
            onChange(rule.allServices || rule.anyPort ? { allServices: false, anyPort: false } : { allServices: true })
          )}
          {toggle(t('deviceNetwork.anyPort', 'Any port'), rule.anyPort, () =>
            onChange(rule.anyPort ? { anyPort: false } : { anyPort: true, allServices: true })
          )}
          {rule.tags.length > 1 && (
            <>
              <Typography variant="caption" color="textSecondary">
                ·
              </Typography>
              {toggle(t('deviceNetwork.anyTag', 'Any tag'), rule.operator === 'ANY', () =>
                onChange({ operator: 'ANY' })
              )}
              {toggle(t('deviceNetwork.allTags', 'All tags'), rule.operator === 'ALL', () =>
                onChange({ operator: 'ALL' })
              )}
            </>
          )}
          <Box sx={{ marginLeft: 'auto' }}>
            {(editable || removable) && (
              <IconButton
                icon="times"
                title={t('deviceNetwork.removeGroup', 'Remove the devices by tag')}
                size="sm"
                onClick={onRemove}
              />
            )}
          </Box>
        </Box>
      </Box>
      {open && devices.length > FILTER && (
        <Box sx={{ paddingX: 2, paddingTop: 1, paddingLeft: 5 }}>
          <TextField
            size="small"
            fullWidth
            placeholder={t('deviceNetwork.filterDevices', 'Filter {{count}} devices', { count: devices.length })}
            value={filter}
            onChange={event => setFilter(event.target.value)}
          />
        </Box>
      )}
      {!rule.holds && (
        <Box sx={{ paddingX: 2, paddingY: 1, paddingLeft: 5, borderTop: 1, borderColor: 'grayLighter.main' }}>
          <Typography variant="caption" color="error">
            {t(
              'deviceNetwork.groupStopped',
              'Stopped: {{email}} no longer administers {{account}}, so its devices are off this network. Someone who administers both can set it again.',
              { email: rule.addedByEmail || '?', account: rule.accountName }
            )}
          </Typography>
        </Box>
      )}
      {rule.holds && !devices.length && !rule.overridden.length && (
        <Box sx={{ paddingX: 2, paddingY: 1, paddingLeft: 5 }}>
          <Typography variant="caption" color="textSecondary">
            {t('deviceNetwork.noMatches', 'No devices carry these tags')}
          </Typography>
        </Box>
      )}
      {shown.map(id => (
        <Box
          key={id}
          sx={{
            display: 'flex',
            gap: 1,
            paddingX: 2,
            paddingY: 1,
            paddingLeft: 5,
            borderTop: 1,
            borderColor: 'grayLighter.main',
          }}
        >
          <Box sx={{ width: NAME_WIDTH - 16, flex: '0 0 auto', minWidth: 0 }}>
            <Typography variant="body2" noWrap sx={{ fontWeight: 500 }} title={nameOf(id)}>
              {nameOf(id)}
            </Typography>
            <Typography variant="caption" color="textSecondary" component="div">
              {[
                rule.initiator && t('deviceNetwork.initiator', 'Initiator'),
                target &&
                  (rule.anyPort
                    ? t('deviceNetwork.targetAllAny', 'Target: all services · any port')
                    : t('deviceNetwork.targetAll', 'Target: all services')),
              ]
                .filter(Boolean)
                .join(' · ') || t('deviceNetwork.nothingYet', 'Nothing yet')}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
              {(deviceById.get(id)?.services || []).map(service => (
                <Chip
                  key={service.id}
                  size="small"
                  label={service.name}
                  color={target ? 'primary' : 'default'}
                  variant={target ? 'filled' : 'outlined'}
                />
              ))}
              <Typography
                variant="caption"
                color="textSecondary"
                sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
              >
                <Icon name="tag" size="xs" />{' '}
                {foreign
                  ? t('deviceNetwork.fromAccountTags', 'from {{account}} tags', { account: rule.accountName })
                  : t('deviceNetwork.fromTags', 'from the tags')}
              </Typography>
            </Box>
          </Box>
        </Box>
      ))}
      {devices.length > GROUP_SHOWN && (
        <Box sx={{ paddingX: 2, paddingY: 1, paddingLeft: 5, borderTop: 1, borderColor: 'grayLighter.main' }}>
          <Typography
            variant="caption"
            color="primary"
            sx={{ cursor: 'pointer' }}
            onClick={() => {
              setOpen(!open)
              setFilter('')
            }}
          >
            {open
              ? t('deviceNetwork.showFewer', 'Show fewer')
              : t('deviceNetwork.moreDevices', '+{{count}} more devices', { count: devices.length - GROUP_SHOWN })}
          </Typography>
        </Box>
      )}
      {rule.overridden.map(id => (
        <Box
          key={id}
          sx={{ paddingX: 2, paddingY: 0.75, paddingLeft: 5, borderTop: 1, borderColor: 'grayLighter.main' }}
        >
          <Typography variant="caption" color="textSecondary">
            {t('deviceNetwork.overridden', '{{name}} carries these tags but is set on its own below', {
              name: nameOf(id),
            })}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}
