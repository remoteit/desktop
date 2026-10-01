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
  RoleAccess,
  AccountAccess,
  graphQLNetworkTag,
  RuleChoices,
  graphQLSetNetworkShareRole,
  ShareRole,
  exposes,
  initiates,
  roleFor,
  targeted,
} from '../services/graphQLDeviceNetworks'
import { State } from '../store'
import { getAllDevices } from '../selectors/devices'
import { selectTags } from '../selectors/tags'
import { useLabel } from '../hooks/useLabel'
import { useDeviceNetworks } from '../hooks/useDeviceNetworks'
import { graphQLRemoveNetworkShare } from '../services/graphQLMutation'
import { Link } from '../components/Link'
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
  // The tab shown — Devices, People or the graph — remembered in this browser for the next network opened.
  const [view, setView] = useState<NetworkView>(savedView)
  const choose = (next: NetworkView) => {
    setView(next)
    try {
      localStorage.setItem(VIEW_KEY, next)
    } catch {
      // Storage refused (a private window): the choice holds for this visit only.
    }
  }
  // What is being added, and from which account: a device one by one, devices by tag, or another account's heading.
  const [adding, setAdding] = useState<{ accountId: string; kind: 'device' | 'tag' } | 'account' | false>(false)
  const [extra, setExtra] = useState<string[]>([]) // accounts opened to add from, with nothing on the network yet
  // Which devices the list shows: all, those that initiate, or those that are targets (exposing something).
  const [show, setShow] = useState<'ALL' | 'INITIATORS' | 'TARGETS'>('ALL')
  const tags = useSelector(selectTags)
  const dark = useSelector((state: State) => state.ui.themeDark)

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
  // Its administrators — the owner, the owning account's admins, admin shares — set who holds each tier and its
  // devices by tag.
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
  // Another account's devices are not in your list: their services come with the network.
  const servicesOf = (member: NetworkMember): ServiceRef[] =>
    deviceById.get(member.deviceId)?.services || member.services || []

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
  // The network's devices by the account they come from — the owner's first, then each other one — each with its
  // devices by tag and those added one by one.
  const rules = network.deviceRules || []
  const ownerOf = (device: IDevice) => device.owner?.id || network.owner.id
  const accountName = (id: string) =>
    ruleAccounts.find(account => account.id === id)?.name ||
    rules.find(rule => rule.accountId === id)?.accountName ||
    network.devices.find(member => member.accountId === id)?.accountName ||
    (id === network.owner.id ? network.owner.email : id)
  const accountIds = [
    network.owner.id,
    ...rules.map(rule => rule.accountId),
    ...network.devices.map(member => member.accountId || network.owner.id),
    ...extra,
  ].filter((id, index, all) => all.indexOf(id) === index)
  const memberShown = (member: NetworkMember) =>
    show === 'ALL' || (show === 'INITIATORS' ? initiates(member) : exposes(network, member))
  const ruleShown = (rule: NetworkRule) =>
    show === 'ALL' || (show === 'INITIATORS' ? rule.initiator : rule.allServices || rule.anyPort)
  const accounts = accountIds
    .map(id => {
      const members = network.devices
        .filter(member => (member.accountId || network.owner.id) === id && memberShown(member))
        .sort((a, b) => nameOf(a.deviceId).localeCompare(nameOf(b.deviceId)))
      const groups = rules.filter(rule => rule.accountId === id && ruleShown(rule))
      const count = new Set([...groups.flatMap(rule => rule.devices), ...members.map(member => member.deviceId)]).size
      return { id, name: accountName(id), members, rules: groups, count }
    })
    // Filtered, an account with nothing of that kind is left out.
    .filter(account => show === 'ALL' || account.count > 0 || account.rules.length > 0)
    .sort((a, b) => (a.id === network.owner.id ? -1 : b.id === network.owner.id ? 1 : a.name.localeCompare(b.name)))
  // Accounts you could add from that are not shown yet: those whose tags you may use, or whose devices you manage.
  const others = [
    ...ruleAccounts.filter(account => account.tags.length).map(account => account.id),
    ...addable.map(ownerOf),
  ].filter((id, index, all) => all.indexOf(id) === index && !accountIds.includes(id))
  // People shared with on their own: a share whose account is no organization (an organization's is under its heading).
  const individuals = network.access
    .filter(a => !a.organizationName && !network.accountAccess?.some(section => section.accountId === a.user.id))
    .map(a => ({ ...a.user, role: a.role || ('CONNECT' as ShareRole) }))
  // The tabs' counts: every device on it, listed or by tag; everyone reaching it — its owner, people shared with, and
  // the members organizations bring in by role.
  const deviceCount = new Set([
    ...network.devices.map(member => member.deviceId),
    ...rules.flatMap(rule => rule.devices),
  ]).size
  const peopleCount = new Set([
    network.owner.id,
    ...network.access.map(share => share.user.id),
    ...(network.accountAccess || []).flatMap(section => [
      section.accountId,
      ...section.roles.flatMap(role => role.members.map(member => member.id)),
    ]),
  ]).size
  // One colour per account across Devices and People: the devices' accounts in their order, then any other, then
  // Individuals.
  const colorOrder = [
    ...accounts.map(account => account.id),
    ...(network.accountAccess || []).map(section => section.accountId),
    INDIVIDUALS,
  ].filter((id, index, all) => all.indexOf(id) === index)
  const colorOf = (accountId: string) => colorOrder.indexOf(accountId)

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
            onChange={(_, value) => value && choose(value)}
            sx={{ marginLeft: 'auto' }}
          >
            <ToggleButton value="devices">
              {t('deviceNetwork.devicesTab', 'Devices {{count}}', { count: deviceCount })}
            </ToggleButton>
            <ToggleButton value="people">
              {t('deviceNetwork.peopleTab', 'People {{count}}', { count: peopleCount })}
            </ToggleButton>
            <ToggleButton value="graph">{t('deviceNetwork.graph', 'Graph')}</ToggleButton>
          </ToggleButtonGroup>
        </Typography>
      }
    >
      {view === 'graph' ? (
        <Gutters>
          <DeviceNetworkGraph network={network} devices={devices} exposure={exposure} />
        </Gutters>
      ) : view === 'devices' ? (
        <List>
          <ListSubheader sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {t('deviceNetwork.devices', 'Devices')}
            <ToggleButtonGroup
              size="small"
              exclusive
              value={show}
              onChange={(_, value) => value && setShow(value)}
              sx={{ '& .MuiToggleButton-root': { paddingY: 0.25, paddingX: 1.25, fontSize: 11 } }}
            >
              <ToggleButton value="ALL">{t('deviceNetwork.showAll', 'All')}</ToggleButton>
              <ToggleButton value="INITIATORS">{t('deviceNetwork.showInitiators', 'Initiators')}</ToggleButton>
              <ToggleButton value="TARGETS">{t('deviceNetwork.showTargets', 'Targets')}</ToggleButton>
            </ToggleButtonGroup>
          </ListSubheader>
          {show !== 'ALL' && !accounts.length && (
            <Empty
              text={
                show === 'INITIATORS'
                  ? t('deviceNetwork.noInitiators', 'No device initiates on this network')
                  : t('deviceNetwork.noTargets', 'No device is a target on this network')
              }
            />
          )}
          {!network.devices.length && !rules.length && !manage && (
            <Empty text={t('deviceNetwork.noDevices', 'No devices on this network yet')} />
          )}
          {accounts.map(account => {
            const tagChoices = ruleAccounts.find(choice => choice.id === account.id)?.tags || []
            const deviceChoices = addable.filter(device => ownerOf(device) === account.id)
            const open = adding && adding !== 'account' && adding.accountId === account.id ? adding.kind : false
            return (
              <React.Fragment key={account.id}>
                <AccountHeadingBand
                  icon="building"
                  name={account.name}
                  color={accountColor(colorOf(account.id), dark)}
                  detail={
                    account.count === 1
                      ? t('deviceNetwork.groupDevice', '1 device')
                      : t('deviceNetwork.groupDevices', '{{count}} devices', { count: account.count })
                  }
                >
                  {!link && !!tagChoices.length && (
                    <IconButton
                      icon="tag"
                      title={t('deviceNetwork.addByTag', 'Add devices by tag')}
                      size="sm"
                      disabled={busy}
                      onClick={() => setAdding(open === 'tag' ? false : { accountId: account.id, kind: 'tag' })}
                    />
                  )}
                  {manage && !link && !!deviceChoices.length && (
                    <IconButton
                      icon="plus"
                      title={t('deviceNetwork.addDevice', 'Add a device')}
                      size="sm"
                      disabled={busy}
                      onClick={() => setAdding(open === 'device' ? false : { accountId: account.id, kind: 'device' })}
                    />
                  )}
                </AccountHeadingBand>
                {open === 'tag' && (
                  <Gutters>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label={t('deviceNetwork.chooseTag', 'Devices tagged')}
                      value=""
                      onChange={event => {
                        const tag = event.target.value
                        setAdding(false)
                        // A group starts with its tag and nothing chosen: its choices are made on its heading.
                        act(() =>
                          graphQLCreateNetworkDeviceRule(network.id, {
                            tags: [tag],
                            accountId: account.id === network.owner.id ? undefined : account.id,
                          })
                        )
                      }}
                    >
                      {tagChoices.map(tag => (
                        <MenuItem key={tag} value={tag}>
                          {tag}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Gutters>
                )}
                {open === 'device' && (
                  <Gutters>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label={t('deviceNetwork.chooseDevice', 'Device to add')}
                      value=""
                      onChange={event => {
                        const deviceId = event.target.value
                        setAdding(false)
                        // Added exposing nothing and initiating nothing: its choices are made here, in place.
                        act(() =>
                          graphQLAddNetworkDevice(network.id, deviceId, {
                            role: 'TARGET',
                            scope: 'LISTED',
                            anyPort: false,
                          })
                        )
                      }}
                    >
                      {deviceChoices.map(device => (
                        <MenuItem key={device.id} value={device.id}>
                          {device.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Gutters>
                )}
                {account.rules.map(rule => (
                  <TagGroup
                    key={rule.id}
                    rule={rule}
                    tags={rule.accountId === network.owner.id ? tags : []}
                    choices={tagChoices}
                    foreign={rule.accountId !== network.owner.id}
                    deviceById={deviceById}
                    editable={rule.editable && !link && !busy}
                    removable={admin && !link && !busy}
                    onChange={set => act(() => graphQLUpdateNetworkDeviceRule(rule.id, set))}
                    onRemove={() => act(() => graphQLRemoveNetworkDeviceRule(rule.id))}
                  />
                ))}
                {!!account.members.length && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.75,
                      paddingX: 2,
                      paddingY: 1,
                      paddingLeft: GROUP_INDENT,
                      borderTop: 1,
                      borderColor: 'grayLighter.main',
                      bgcolor: 'grayLightest.main',
                    }}
                  >
                    <Icon name="laptop" size="sm" color="grayDark" />
                    <Typography variant="body2">{t('deviceNetwork.oneByOne', 'Added one by one')}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      ·{' '}
                      {account.members.length === 1
                        ? t('deviceNetwork.groupDevice', '1 device')
                        : t('deviceNetwork.groupDevices', '{{count}} devices', { count: account.members.length })}
                    </Typography>
                  </Box>
                )}
                {account.members.map(member => (
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
                {!account.members.length && !account.rules.length && (
                  <Empty text={t('deviceNetwork.noAccountDevices', 'None yet: add devices by tag or one by one')} />
                )}
              </React.Fragment>
            )
          })}
          {!link && !!others.length && (
            <Box sx={{ paddingX: 2, paddingY: 1, borderTop: 1, borderColor: 'grayLight.main' }}>
              {adding === 'account' ? (
                <TextField
                  select
                  fullWidth
                  size="small"
                  label={t('deviceNetwork.chooseAccount', 'Account')}
                  value=""
                  onChange={event => {
                    setAdding(false)
                    setExtra([...extra, String(event.target.value)])
                  }}
                >
                  {others.map(id => (
                    <MenuItem key={id} value={id}>
                      {accountName(id)}
                    </MenuItem>
                  ))}
                </TextField>
              ) : (
                <Typography
                  variant="caption"
                  color="primary"
                  sx={{ cursor: 'pointer' }}
                  onClick={() => setAdding('account')}
                >
                  {t('deviceNetwork.addFromAccount', '+ Add from another account')}
                </Typography>
              )}
            </Box>
          )}
        </List>
      ) : (
        <List>
          <ListSubheader>
            {t('deviceNetwork.people', 'People')}
            {admin && (
              <IconButton
                icon="user-plus"
                title={t('deviceNetwork.share', 'Share the network')}
                to={`/networks/${network.id}/share`}
                size="sm"
              />
            )}
          </ListSubheader>
          {(network.accountAccess || []).map(section => (
            <AccountPeople
              key={section.accountId}
              section={section}
              color={accountColor(colorOf(section.accountId), dark)}
              devices={network.userModeDevices || []}
              admin={admin && !busy}
              onTier={role => act(() => graphQLSetNetworkShareRole(network.id, section.email, role))}
              onUnshare={() => act(() => graphQLRemoveNetworkShare(network.id, section.email))}
              onTag={(name, on) => act(() => graphQLNetworkTag(network.id, section.accountId, name, on))}
            />
          ))}
          {!network.accountAccess?.length && (
            <PersonRow
              email={network.owner.email}
              owner
              role="ADMIN"
              devices={(network.userModeDevices || []).filter(device => device.userId === network.owner.id)}
              editable={false}
              onRole={() => undefined}
              onRemove={() => undefined}
            />
          )}
          {!!individuals.length && (
            <AccountHeadingBand
              icon="users"
              name={t('deviceNetwork.individuals', 'Individuals')}
              color={accountColor(colorOf(INDIVIDUALS), dark)}
              detail={
                individuals.length === 1
                  ? t('deviceNetwork.onePerson', '1 person')
                  : t('deviceNetwork.peopleCount', '{{count}} people', { count: individuals.length })
              }
            />
          )}
          {individuals.map(person => (
            <PersonRow
              key={person.id}
              email={person.email}
              owner={false}
              role={person.role}
              devices={(network.userModeDevices || []).filter(device => device.userId === person.id)}
              editable={admin && !busy}
              onRole={role => act(() => graphQLSetNetworkShareRole(network.id, person.email, role))}
              onRemove={() => act(() => graphQLRemoveNetworkShare(network.id, person.email))}
            />
          ))}
          {!!network.accountAccess?.some(section => section.roles.length) && (
            <Box sx={{ paddingX: 2, paddingY: 1, borderTop: 1, borderColor: 'grayLighter.main' }}>
              <Typography variant="caption" color="textSecondary">
                {t(
                  'deviceNetwork.rolesNote',
                  "An organization's roles decide which of its people reach this network — all networks, or those it has tagged — up to the tier it holds."
                )}{' '}
                <Link to="/organization/roles">{t('deviceNetwork.editRoles', 'Edit roles')}</Link>
              </Typography>
            </Box>
          )}
        </List>
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
// Under an account's heading: its groups' headings one step in, their devices two — so every device's chips start
// in one column, and a group's switches line up above its devices' chips.
const GROUP_INDENT = 4
const ROW_INDENT = 6
const HEADING_WIDTH = `calc(${NAME_WIDTH}px + 16px)` // NAME_WIDTH + the step from GROUP_INDENT to ROW_INDENT

/* A device on the network, in two rows of chips: Initiator, All services and Any port, then its services in their own
   order — highlighted when exposed, all of them when All services or Any port is on. A long list folds to its first
   few and "+N more"; open, it can be filtered. */
const MemberRow: React.FC<{
  name: string
  member: NetworkMember
  services: ServiceRef[]
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
  const exposed = (service: ServiceRef) => allOn || (targeted(member) && listed.has(service.id))
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
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        paddingX: 2,
        paddingLeft: ROW_INDENT,
        paddingY: 1,
        borderTop: 1,
        borderColor: 'grayLighter.main',
      }}
    >
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
  caption?: string
  owner: boolean
  role: ShareRole
  devices: { deviceId: string; name: string }[]
  editable: boolean
  onRole: (role: ShareRole) => void
  onRemove: () => void
}> = ({ email, caption, owner, role, devices, editable, onRole, onRemove }) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const folded = devices.length > INLINE && !open
  const shown = folded ? devices.slice(0, SHOWN) : devices

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        paddingX: 2,
        paddingLeft: GROUP_INDENT,
        paddingY: 1,
        borderTop: 1,
        borderColor: 'grayLighter.main',
      }}
    >
      <Box sx={{ width: NAME_WIDTH, flex: '0 0 auto', minWidth: 0, paddingTop: 0.25 }}>
        <Typography variant="body2" noWrap sx={{ fontWeight: 500 }} title={email}>
          {email}
        </Typography>
        {caption && (
          <Typography variant="caption" color="textSecondary" component="div">
            {caption}
          </Typography>
        )}
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
          <Icon
            name={owner ? 'crown' : role === 'ADMIN' ? 'user-shield' : role === 'MANAGE' ? 'sliders' : 'plug'}
            size="sm"
            color="grayDark"
          />
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
              <MenuItem value="ADMIN">{t('deviceNetwork.roleAdmin', 'Admin')}</MenuItem>
            </TextField>
          ) : (
            <Typography variant="body2">
              {owner
                ? t('deviceNetwork.ownerRole', 'Owner · admin')
                : role === 'ADMIN'
                ? t('deviceNetwork.roleAdmin', 'Admin')
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

const INDIVIDUALS = 'individuals'

type NetworkView = 'devices' | 'people' | 'graph'
const VIEW_KEY = 'deviceNetwork.view'
const savedView = (): NetworkView => {
  try {
    const saved = localStorage.getItem(VIEW_KEY)
    return saved === 'people' || saved === 'graph' ? saved : 'devices'
  } catch {
    return 'devices'
  }
}

// An account's heading band, in its colour: the same in Devices and People.
const AccountHeadingBand: React.FC<{
  icon: string
  name: string
  color: { background: string; text: string }
  detail?: React.ReactNode
  children?: React.ReactNode
}> = ({ icon, name, color, detail, children }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      paddingX: 2,
      paddingY: 1,
      borderTop: 1,
      borderColor: 'grayLight.main',
      bgcolor: color.background,
      color: color.text,
    }}
  >
    <Icon name={icon} size="sm" color={color.text} />
    <Typography variant="body1" sx={{ fontWeight: 500, color: 'inherit' }} noWrap>
      {name}
    </Typography>
    {detail && (
      <Typography
        variant="caption"
        component="div"
        sx={{ color: 'inherit', opacity: 0.85, display: 'flex', alignItems: 'center', gap: 0.5 }}
      >
        · {detail}
      </Typography>
    )}
    <Box sx={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>{children}</Box>
  </Box>
)

/* The people reaching the network through one organization: the owning one — its owner and its roles — or one it is
   shared with, whose heading carries the share (its tier, a ceiling for its members, and unsharing) and whose roles,
   by its own tags on the network, decide which of its people get in. Its tags on the network are set here, by its
   administrators. */
const AccountPeople: React.FC<{
  section: AccountAccess
  color: { background: string; text: string }
  devices: { userId: string; deviceId: string; name: string }[]
  admin: boolean
  onTier: (role: ShareRole) => void
  onUnshare: () => void
  onTag: (name: string, on: boolean) => void
}> = ({ section, color, devices, admin, onTier, onUnshare, onTag }) => {
  const { t } = useTranslation()
  const getColor = useLabel()
  const count = new Set([section.accountId, ...section.roles.flatMap(role => role.members.map(member => member.id))])
    .size
  const people =
    count === 1
      ? t('deviceNetwork.onePerson', '1 person')
      : t('deviceNetwork.peopleCount', '{{count}} people', { count })
  return (
    <>
      <AccountHeadingBand
        icon="building"
        name={section.accountName}
        color={color}
        detail={
          section.owner ? (
            <>
              {t('deviceNetwork.owner', 'owner')} · {people}
            </>
          ) : (
            <>
              {t('deviceNetwork.sharedUpTo', 'shared · up to')}{' '}
              {admin ? (
                <TextField
                  select
                  size="small"
                  variant="standard"
                  value={section.tier}
                  onChange={event => onTier(event.target.value as ShareRole)}
                  InputProps={{ disableUnderline: true }}
                  SelectProps={{ sx: { paddingRight: '24px !important', fontSize: 12, color: color.text } }}
                >
                  <MenuItem value="CONNECT">{t('deviceNetwork.roleConnect', 'Can connect')}</MenuItem>
                  <MenuItem value="MANAGE">{t('deviceNetwork.roleManage', 'Can manage')}</MenuItem>
                  <MenuItem value="ADMIN">{t('deviceNetwork.roleAdmin', 'Admin')}</MenuItem>
                </TextField>
              ) : (
                tierLabel(t, section.tier)
              )}{' '}
              · {people}
            </>
          )
        }
      >
        {!section.owner && admin && (
          <IconButton
            icon="times"
            title={t('deviceNetwork.unshareOrg', 'Stop sharing with {{name}}', { name: section.accountName })}
            size="sm"
            color={color.text}
            onClick={onUnshare}
          />
        )}
      </AccountHeadingBand>
      {(!!section.tags.length || section.tagsEditable) && (
        <NetworkTags
          label={t('deviceNetwork.taggedIn', 'Its tags here')}
          names={section.tags.map(tag => tag.name)}
          colorOf={name => getColor(section.tags.find(tag => tag.name === name)?.color ?? 0)}
          choices={section.tagChoices}
          editable={section.tagsEditable}
          onAdd={name => onTag(name, true)}
          onRemove={name => onTag(name, false)}
        />
      )}
      <PersonRow
        email={section.email}
        owner={section.owner}
        role={section.tier}
        caption={section.owner ? undefined : t('deviceNetwork.itsOwner', 'Its owner')}
        devices={devices.filter(device => device.userId === section.accountId)}
        editable={false}
        onRole={() => undefined}
        onRemove={() => undefined}
      />
      {section.roles.map(access => (
        <RoleRow key={`${access.roleId}/${access.tier}`} access={access} devices={devices} />
      ))}
    </>
  )
}

const tierLabel = (t: (key: string, fallback: string) => string, tier: ShareRole) =>
  tier === 'ADMIN'
    ? t('deviceNetwork.roleAdmin', 'Admin')
    : tier === 'MANAGE'
    ? t('deviceNetwork.roleManage', 'Can manage')
    : t('deviceNetwork.roleConnect', 'Can connect')

// Past this many matching devices, a group shows the first SHOWN and "+N more devices".
const GROUP_SHOWN = 6

type ServiceRef = { id: string; name: string }

// An account's colour on its heading, by its place on the page — the owner's first — so the accounts on one network
// never share one: muted colours chosen to stay clear of the tag colours, a light tint with dark text (in dark mode, a
// deep tint with light text).
const ACCOUNT_COLORS = [
  { light: '#EEEDFE', text: '#3C3489', deep: '#3C3489', lightText: '#CECBF6' }, // purple
  { light: '#E1F5EE', text: '#085041', deep: '#085041', lightText: '#9FE1CB' }, // teal
  { light: '#FAECE7', text: '#712B13', deep: '#712B13', lightText: '#F5C4B3' }, // coral
  { light: '#FBEAF0', text: '#72243E', deep: '#72243E', lightText: '#F4C0D1' }, // pink
  { light: '#E6F1FB', text: '#0C447C', deep: '#0C447C', lightText: '#B5D4F4' }, // blue
]
const accountColor = (index: number, dark: boolean) => {
  const color = ACCOUNT_COLORS[index % ACCOUNT_COLORS.length]
  return dark ? { background: color.deep, text: color.lightText } : { background: color.light, text: color.text }
}

/* Devices by tag: a heading — its tags (removable, and "+ tag" to add one), Initiator, All services, Any port, and Any
   tag / All tags when it has several — and a row for each device it makes a member, showing what the heading gives it
   (set on the heading, not per device). A device it matches but that is added on its own is a line saying so: its own
   row is what it is. Folds past GROUP_SHOWN devices. */

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
      <Box sx={{ paddingX: 2, paddingLeft: GROUP_INDENT, paddingY: 1, bgcolor: 'grayLightest.main' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Box sx={{ width: HEADING_WIDTH, flex: '0 0 auto', minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
              <Icon name="tag" size="sm" color="grayDark" />
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
                sx={{ marginTop: 1 }}
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
              onChange(
                rule.allServices || rule.anyPort ? { allServices: false, anyPort: false } : { allServices: true }
              )
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
        <Typography variant="caption" color="textSecondary" component="div" sx={{ marginTop: 0.5 }}>
          {[
            rule.devices.length === 1
              ? t('deviceNetwork.groupDevice', '1 device')
              : t('deviceNetwork.groupDevices', '{{count}} devices', { count: rule.devices.length }),
            ...summary,
          ].join(' · ') || t('deviceNetwork.nothingChosen', 'Nothing chosen yet')}
        </Typography>
      </Box>
      {open && devices.length > FILTER && (
        <Box sx={{ paddingX: 2, paddingTop: 1, paddingLeft: ROW_INDENT }}>
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
        <Box sx={{ paddingX: 2, paddingY: 1, paddingLeft: ROW_INDENT, borderTop: 1, borderColor: 'grayLighter.main' }}>
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
        <Box sx={{ paddingX: 2, paddingY: 1, paddingLeft: ROW_INDENT }}>
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
            paddingLeft: ROW_INDENT,
            borderTop: 1,
            borderColor: 'grayLighter.main',
          }}
        >
          <Box sx={{ width: NAME_WIDTH, flex: '0 0 auto', minWidth: 0 }}>
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
              {(deviceById.get(id)?.services || rule.named?.find(device => device.id === id)?.services || []).map(
                service => (
                  <Chip
                    key={service.id}
                    size="small"
                    label={service.name}
                    color={target ? 'primary' : 'default'}
                    variant={target ? 'filled' : 'outlined'}
                  />
                )
              )}
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
        <Box sx={{ paddingX: 2, paddingY: 1, paddingLeft: ROW_INDENT, borderTop: 1, borderColor: 'grayLighter.main' }}>
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
          sx={{ paddingX: 2, paddingY: 0.75, paddingLeft: ROW_INDENT, borderTop: 1, borderColor: 'grayLighter.main' }}
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

/* An account's tags on the network: an organization role with access by tag reaches the networks carrying its tags,
   so they decide which of its members reach this one. That account's administrators change them. */
const NetworkTags: React.FC<{
  label: string
  names: string[]
  colorOf: (name: string) => string
  choices: string[]
  editable: boolean
  onAdd: (name: string) => void
  onRemove: (name: string) => void
}> = ({ label, names, colorOf, choices, editable, onAdd, onRemove }) => {
  const { t } = useTranslation()
  const [picking, setPicking] = useState(false)
  return (
    <Box sx={{ paddingX: 2, paddingLeft: GROUP_INDENT, paddingY: 1, borderTop: 1, borderColor: 'grayLighter.main' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
        <Icon name="tag" size="sm" color="grayDark" />
        <Typography variant="caption" color="textSecondary">
          {label}
        </Typography>
        {names.map(name => (
          <Chip
            key={name}
            size="small"
            variant="outlined"
            icon={
              <Box
                component="span"
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: colorOf(name),
                  marginLeft: '8px !important',
                }}
              />
            }
            label={name}
            onDelete={editable ? () => onRemove(name) : undefined}
          />
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
        {!names.length && (
          <Typography variant="caption" color="textSecondary">
            {t('deviceNetwork.noNetworkTags', 'none')}
          </Typography>
        )}
      </Box>
      {picking && (
        <TextField
          select
          size="small"
          value=""
          label={t('deviceNetwork.chooseNetworkTag', 'Tag the network')}
          sx={{ marginTop: 1, minWidth: 240 }}
          onChange={event => {
            setPicking(false)
            onAdd(event.target.value)
          }}
        >
          {choices
            .filter(name => !names.includes(name))
            .map(name => (
              <MenuItem key={name} value={name}>
                {name}
              </MenuItem>
            ))}
        </TextField>
      )}
    </Box>
  )
}

/* An organization role reaching the network at connect or more — every network, or those carrying its tags — with
   its members, folded: open, each member with their devices in user mode. Changed on the organization's Roles page,
   not here. */
const RoleRow: React.FC<{
  access: RoleAccess
  devices: { userId: string; deviceId: string; name: string }[]
}> = ({ access, devices }) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [all, setAll] = useState(false)
  const count = access.members.length
  const members = all ? access.members : access.members.slice(0, INLINE)
  const reach = access.byTag
    ? t('deviceNetwork.roleByTag', 'Networks tagged {{tags}}', {
        tags: access.tags.join(access.operator === 'ALL' ? ' + ' : ' or '),
      })
    : t('deviceNetwork.roleAll', 'All networks')
  const tier =
    access.tier === 'ADMIN'
      ? t('deviceNetwork.roleAdmin', 'Admin')
      : access.tier === 'MANAGE'
      ? t('deviceNetwork.roleManage', 'Can manage')
      : t('deviceNetwork.roleConnect', 'Can connect')

  return (
    <Box sx={{ borderTop: 1, borderColor: 'grayLighter.main' }}>
      <Box
        sx={{ display: 'flex', gap: 1, paddingX: 2, paddingLeft: GROUP_INDENT, paddingY: 1, cursor: 'pointer' }}
        onClick={() => setOpen(!open)}
      >
        <Box sx={{ width: NAME_WIDTH, flex: '0 0 auto', minWidth: 0, paddingTop: 0.25 }}>
          <Typography variant="body2" noWrap sx={{ fontWeight: 500 }} title={access.roleName}>
            <Icon name={open ? 'chevron-down' : 'chevron-right'} size="xs" /> {access.roleName}
          </Typography>
          <Typography variant="caption" color="textSecondary" component="div">
            {reach}
          </Typography>
        </Box>
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 0.75, minHeight: 28 }}>
          <Icon
            name={access.tier === 'ADMIN' ? 'user-shield' : access.tier === 'MANAGE' ? 'sliders' : 'plug'}
            size="sm"
            color="grayDark"
          />
          <Typography variant="body2">{tier}</Typography>
          <Typography variant="caption" color="textSecondary">
            ·{' '}
            {count === 1
              ? t('deviceNetwork.onePerson', '1 person')
              : t('deviceNetwork.peopleCount', '{{count}} people', { count })}
          </Typography>
        </Box>
      </Box>
      {open &&
        members.map(member => {
          const own = devices.filter(device => device.userId === member.id)
          return (
            <Box
              key={member.id}
              sx={{
                display: 'flex',
                gap: 1,
                paddingX: 2,
                paddingY: 0.75,
                paddingLeft: ROW_INDENT,
                alignItems: 'center',
              }}
            >
              <Typography variant="body2" noWrap sx={{ width: NAME_WIDTH - 24, flex: '0 0 auto' }} title={member.email}>
                {member.email}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                {own.map(device => (
                  <Chip
                    key={device.deviceId}
                    size="small"
                    color="primary"
                    icon={<Icon name="laptop" size="xs" />}
                    label={device.name}
                  />
                ))}
              </Box>
            </Box>
          )
        })}
      {open && count > INLINE && (
        <Box sx={{ paddingX: 2, paddingBottom: 1, paddingLeft: ROW_INDENT }}>
          <Typography variant="caption" color="primary" sx={{ cursor: 'pointer' }} onClick={() => setAll(!all)}>
            {all
              ? t('deviceNetwork.showLess', 'Show less')
              : t('deviceNetwork.morePeople', '+{{count}} more people', { count: count - INLINE })}
          </Typography>
        </Box>
      )}
    </Box>
  )
}
