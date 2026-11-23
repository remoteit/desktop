import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Box, Button, Chip, List, ListSubheader, MenuItem, Tab, TextField, Typography } from '@mui/material'
import {
  NetworkMember,
  NetworkRule,
  Reached,
  RoleAccess,
  AccountAccess,
  RuleChoices,
  ShareRole,
  canReach,
  deviceCount,
  exposes,
  graphQLAddNetworkDevice,
  graphQLCreateNetworkDeviceRule,
  graphQLListNetworkService,
  graphQLNetworkTag,
  graphQLRemoveNetworkDevice,
  graphQLRemoveNetworkDeviceRule,
  graphQLSetNetworkShareRole,
  graphQLUpdateNetworkDeviceRule,
  membershipFor,
  peopleCount,
  reachedOf,
  ruleChoicesFor,
  ruleReachedOf,
  targeted,
} from '../services/graphQLDeviceNetworks'
import { Dispatch, State } from '../store'
import { getAllDevices } from '../selectors/devices'
import { selectTags } from '../selectors/tags'
import { selectActiveAccountId } from '../selectors/accounts'
import { reloadDeviceNetworks, useDeviceNetworks } from '../hooks/useDeviceNetworks'
import { graphQLDeleteNetwork, graphQLRemoveNetworkShare } from '../services/graphQLMutation'
import { Link } from '../components/Link'
import { LoadingMessage } from '../components/LoadingMessage'
import { IconButton } from '../buttons/IconButton'
import { DeleteButton } from '../buttons/DeleteButton'
import { Container } from '../components/Container'
import { PageTabs } from '../components/PageTabs'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { Icon } from '../components/Icon'
import { Tag } from '../components/Tag'
import { DeviceNetworkGraph } from '../components/DeviceNetworkGraph'
import { devicesText, peopleText, ruleSentence, tagsText } from '../components/DeviceNetworkWords'
import { NetworkExits } from '../components/NetworkExits'
import { spacing } from '../styling'

/* A network of devices: its map, its devices — for each, whether it can reach the devices that can be reached, and
   how it can be reached — and its people. A device joins only when you manage both it and the network. */
export const DeviceNetworkPage: React.FC = () => {
  const { t } = useTranslation()
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()
  const { networkID } = useParams<{ networkID?: string }>()
  const { networks, reload } = useDeviceNetworks()
  const devices = useSelector(getAllDevices)
  const [busy, setBusy] = useState(false)
  const [view, setView] = useState<NetworkView>('map')
  const [adding, setAdding] = useState<{ kind: 'device' | 'tag'; accountId?: string } | 'account' | false>(false)
  const [extra, setExtra] = useState<string[]>([]) // accounts opened to add from, with nothing on the network yet
  const [show, setShow] = useState<'ALL' | 'REACH' | 'REACHED'>('ALL')
  const tags = useSelector(selectTags)
  const dark = useSelector((state: State) => state.ui.themeDark)
  const accountId = useSelector(selectActiveAccountId)
  const userId = useSelector((state: State) => state.auth.user?.id)

  useEffect(() => {
    setView('map')
    setAdding(false)
    setExtra([])
    setShow('ALL')
  }, [networkID])

  const network = Array.isArray(networks) ? networks.find(n => n.id === networkID) : undefined
  if (networks === undefined) return <LoadingMessage />
  if (!network)
    return (
      <Container gutterBottom header={<Typography variant="h1">{t('deviceNetwork.title', 'Network')}</Typography>}>
        <Gutters>
          <Notice severity={networks === 'ERROR' ? 'error' : 'info'} fullWidth>
            {networks === 'ERROR'
              ? t('deviceNetwork.readError', 'Couldn’t load this network. Check your connection and try again.')
              : t(
                  'deviceNetwork.none',
                  'This network isn’t here. It may have been deleted, or it is no longer shared with you.'
                )}
          </Notice>
          <Button sx={{ marginTop: 2 }} onClick={() => (networks === 'ERROR' ? reload() : history.push('/networks'))}>
            {networks === 'ERROR'
              ? t('deviceNetwork.tryAgain', 'Try again')
              : t('deviceNetwork.back', 'Show all networks')}
          </Button>
        </Gutters>
      </Container>
    )

  const manage = network.permissions.includes('MANAGE')
  const admin = network.permissions.includes('ADMIN')
  const owner = network.owner.id === userId
  const link = network.kind === 'LINK'
  const deviceById = new Map(devices.map(device => [device.id, device]))
  const nameOf = (id: string) =>
    deviceById.get(id)?.name ||
    network.devices.find(member => member.deviceId === id)?.name ||
    (network.deviceRules || []).flatMap(rule => rule.named || []).find(device => device.id === id)?.name ||
    id
  const listed = new Set(network.connections.map(connection => connection.service.id))
  const ruleAccounts = network.ruleAccounts || []
  const rules = network.deviceRules || []

  const act = async (change: () => Promise<unknown>) => {
    setBusy(true)
    await change()
    await reload()
    setBusy(false)
  }
  const listedOf = (member: NetworkMember) =>
    network.connections.filter(connection => connection.service.device?.id === member.deviceId).length
  // Another account's devices are not in your list: their services come with the network.
  const servicesOf = (member: NetworkMember): ServiceRef[] =>
    deviceById.get(member.deviceId)?.services || member.services || []
  const save = (member: NetworkMember, reach: boolean, reached: Reached) =>
    graphQLAddNetworkDevice(network.id, member.deviceId, membershipFor(reach, reached))

  const setReach = (member: NetworkMember, reach: boolean) =>
    act(() => save(member, reach, reachedOf(member, listedOf(member))))

  const setReached = (member: NetworkMember, reached: Reached) =>
    act(async () => {
      const reach = canReach(member)
      if (reached === 'NOTHING') {
        for (const service of servicesOf(member))
          if (listed.has(service.id)) await graphQLListNetworkService(network.id, service.id, false)
        return save(member, reach, 'NOTHING')
      }
      // Chosen from all services: every service starts chosen, so nothing changes until one is unchosen.
      if (reached === 'CHOSEN' && !listedOf(member))
        for (const service of servicesOf(member)) await graphQLListNetworkService(network.id, service.id, true)
      return save(member, reach, reached)
    })

  // A chosen service on or off. A device its product holds keeps its role: only what the network lists changes.
  const setService = (member: NetworkMember, serviceId: string) =>
    act(async () => {
      const listing = !listed.has(serviceId)
      await graphQLListNetworkService(network.id, serviceId, listing)
      if (member.fromProduct) return
      const count = listedOf(member) + (listing ? 1 : -1)
      const next = membershipFor(canReach(member), count > 0 ? 'CHOSEN' : 'NOTHING')
      if (next.role !== member.role || next.scope !== member.scope || next.anyPort !== member.anyPort)
        await graphQLAddNetworkDevice(network.id, member.deviceId, next)
    })

  const addable = devices.filter(
    device => device.permissions.includes('MANAGE') && !network.devices.some(member => member.deviceId === device.id)
  )
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
    show === 'ALL' || (show === 'REACH' ? canReach(member) : exposes(network, member))
  const ruleShown = (rule: NetworkRule) =>
    show === 'ALL' || (show === 'REACH' ? rule.initiator : rule.allServices || rule.anyPort)
  const accounts = accountIds
    .map(id => {
      const members = network.devices
        .filter(member => (member.accountId || network.owner.id) === id && memberShown(member))
        .sort((a, b) => nameOf(a.deviceId).localeCompare(nameOf(b.deviceId)))
      const groups = rules.filter(rule => rule.accountId === id && ruleShown(rule))
      const count = new Set([...groups.flatMap(rule => rule.devices), ...members.map(member => member.deviceId)]).size
      return { id, name: accountName(id), members, rules: groups, count }
    })
    .filter(account => show === 'ALL' || account.count > 0 || account.rules.length > 0)
    .sort((a, b) => (a.id === network.owner.id ? -1 : b.id === network.owner.id ? 1 : a.name.localeCompare(b.name)))
  const others = [
    ...ruleAccounts.filter(account => account.tags.length).map(account => account.id),
    ...addable.map(ownerOf),
  ].filter((id, index, all) => all.indexOf(id) === index && !accountIds.includes(id))
  const individuals = network.access
    .filter(a => !a.organizationName && !network.accountAccess?.some(section => section.accountId === a.user.id))
    .map(a => ({ ...a.user, role: a.role || ('CONNECT' as ShareRole) }))
  const alsoTagged = (deviceId: string) => rules.filter(rule => rule.overridden.includes(deviceId))
  const empty = !network.devices.length && !rules.length
  const canAdd = manage && !link && (!!addable.length || ruleAccounts.some(account => account.tags.length))
  const colorOrder = [
    ...accounts.map(account => account.id),
    ...(network.accountAccess || []).map(section => section.accountId),
    INDIVIDUALS,
  ].filter((id, index, all) => all.indexOf(id) === index)
  const colorOf = (accountId: string) => colorOrder.indexOf(accountId)

  const startAdding = () => {
    setView('devices')
    setShow('ALL')
    setAdding({ kind: addable.length ? 'device' : 'tag' })
  }

  const addDevice = (deviceId: string) => {
    setAdding(false)
    act(() => graphQLAddNetworkDevice(network.id, deviceId, membershipFor(false, 'NOTHING')))
  }
  const addRule = (ruleAccount: string, tag: string) => {
    setAdding(false)
    act(() =>
      graphQLCreateNetworkDeviceRule(network.id, {
        tags: [tag],
        accountId: ruleAccount === network.owner.id ? undefined : ruleAccount,
      })
    )
  }

  const tabLabel = (text: string, count?: number) => (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
      {text}
      {count !== undefined && (
        <Box component="span" sx={{ opacity: 0.6 }}>
          {count}
        </Box>
      )}
    </Box>
  )

  const addButton = (
    <Button
      variant="contained"
      size="small"
      disabled={busy}
      onClick={startAdding}
      startIcon={<Icon name="plus" size="sm" inline />}
      sx={{ flexShrink: 0 }}
    >
      {t('deviceNetwork.addDevice', 'Add device')}
    </Button>
  )

  return (
    <Container
      gutterBottom
      bodyProps={{ verticalOverflow: true }}
      header={
        <>
          <Typography variant="h1" sx={{ alignItems: 'center', gap: 1 }}>
            <Title>{network.name}</Title>
            {link && <Chip size="small" label={t('deviceNetwork.link', 'Link')} />}
            {canAdd && addButton}
            {owner && (
              <DeleteButton
                title={t('deviceNetwork.delete', 'Delete network')}
                warning={
                  <Notice severity="error" fullWidth>
                    {t('deviceNetwork.deleteWarning', 'Deleting {{name}} removes it for everyone. Its devices stay.', {
                      name: network.name,
                    })}
                  </Notice>
                }
                onDelete={async () => {
                  await graphQLDeleteNetwork(network.id)
                  await reloadDeviceNetworks(accountId)
                  dispatch.networks.fetch()
                  history.push('/networks')
                }}
              />
            )}
          </Typography>
          <PageTabs value={view} onChange={(_, value) => setView(value)} sx={{ marginX: 4.5, marginTop: 1 }}>
            <Tab value="map" label={tabLabel(t('deviceNetwork.mapTab', 'Map'))} />
            <Tab value="devices" label={tabLabel(t('deviceNetwork.devicesTab', 'Devices'), deviceCount(network))} />
            <Tab value="people" label={tabLabel(t('deviceNetwork.peopleTab', 'People'), peopleCount(network))} />
          </PageTabs>
        </>
      }
    >
      {view === 'map' ? (
        empty ? (
          <EmptyNetwork
            text={
              manage
                ? t('deviceNetwork.emptyManage', 'Add devices to {{name}}. Then choose which can reach the others.', {
                    name: network.name,
                  })
                : t('deviceNetwork.emptyView', 'No devices on this network yet.')
            }
            action={canAdd && addButton}
          />
        ) : (
          <Gutters>
            <DeviceNetworkGraph network={network} devices={devices} />
          </Gutters>
        )
      ) : view === 'devices' ? (
        <List disablePadding>
          {adding && adding !== 'account' && !adding.accountId && (
            <AddPanel
              kind={adding.kind}
              devices={addable.map(device => ({
                id: device.id,
                name: device.name,
                account: accountName(ownerOf(device)),
              }))}
              tagChoices={ruleAccounts.flatMap(account =>
                account.tags.map(tag => ({ accountId: account.id, account: account.name, tag }))
              )}
              onKind={kind => setAdding({ kind })}
              onDevice={addDevice}
              onTag={addRule}
              onCancel={() => setAdding(false)}
            />
          )}
          {empty ? (
            <EmptyNetwork
              text={
                manage
                  ? t('deviceNetwork.emptyManage', 'Add devices to {{name}}. Then choose which can reach the others.', {
                      name: network.name,
                    })
                  : t('deviceNetwork.emptyView', 'No devices on this network yet.')
              }
              action={canAdd && !adding && addButton}
            />
          ) : (
            <ListSubheader sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              {t('deviceNetwork.show', 'Show')}
              <Box
                sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', '& .MuiChip-root': { letterSpacing: 'normal' } }}
                role="group"
                data-show={show}
              >
                {(
                  [
                    ['ALL', t('deviceNetwork.showAll', 'All')],
                    ['REACH', t('deviceNetwork.showReach', 'Can reach')],
                    ['REACHED', t('deviceNetwork.showReached', 'Can be reached')],
                  ] as const
                ).map(([value, label]) => (
                  <Chip
                    key={value}
                    size="small"
                    label={label}
                    color={show === value ? 'primary' : undefined}
                    aria-pressed={show === value}
                    onClick={() => setShow(value)}
                  />
                ))}
              </Box>
            </ListSubheader>
          )}
          {!empty && show !== 'ALL' && !accounts.length && (
            <EmptyLine
              text={
                show === 'REACH'
                  ? t('deviceNetwork.noReach', 'No device can reach the others yet.')
                  : t('deviceNetwork.noReached', 'No device can be reached yet.')
              }
            />
          )}
          {!empty &&
            accounts.map(account => {
              const tagChoices = ruleAccounts.find(choice => choice.id === account.id)?.tags || []
              const deviceChoices = addable.filter(device => ownerOf(device) === account.id)
              const open = adding && adding !== 'account' && adding.accountId === account.id ? adding.kind : false
              return (
                <React.Fragment key={account.id}>
                  <AccountHeadingBand
                    icon="building"
                    name={account.name}
                    color={accountColor(colorOf(account.id), dark)}
                    detail={devicesText(t, account.count)}
                  >
                    {manage && !link && !!deviceChoices.length && (
                      <Button
                        size="small"
                        color="inherit"
                        disabled={busy}
                        onClick={() => setAdding(open === 'device' ? false : { accountId: account.id, kind: 'device' })}
                      >
                        {t('deviceNetwork.addDevice', 'Add device')}
                      </Button>
                    )}
                    {!link && !!tagChoices.length && (
                      <Button
                        size="small"
                        color="inherit"
                        disabled={busy}
                        onClick={() => setAdding(open === 'tag' ? false : { accountId: account.id, kind: 'tag' })}
                      >
                        {t('deviceNetwork.addByTag', 'Add by tag')}
                      </Button>
                    )}
                  </AccountHeadingBand>
                  {open && (
                    <AddPanel
                      kind={open}
                      fixed
                      devices={deviceChoices.map(device => ({ id: device.id, name: device.name }))}
                      tagChoices={tagChoices.map(tag => ({ accountId: account.id, tag }))}
                      onKind={kind => setAdding({ kind, accountId: account.id })}
                      onDevice={addDevice}
                      onTag={addRule}
                      onCancel={() => setAdding(false)}
                    />
                  )}
                  {account.rules.map(rule => (
                    <TagRule
                      key={rule.id}
                      rule={rule}
                      tags={rule.accountId === network.owner.id ? tags : []}
                      choices={tagChoices}
                      nameOf={nameOf}
                      editable={rule.editable && !link && !busy}
                      removable={admin && !link && !busy}
                      onChange={set => act(() => graphQLUpdateNetworkDeviceRule(rule.id, set))}
                      onRemove={() => act(() => graphQLRemoveNetworkDeviceRule(rule.id))}
                    />
                  ))}
                  {!!account.rules.length && !!account.members.length && (
                    <Box
                      sx={{
                        paddingX: 2,
                        paddingLeft: ROW_INDENT,
                        paddingY: 0.75,
                        borderTop: 1,
                        borderColor: 'grayLighter.main',
                        bgcolor: 'grayLightest.main',
                      }}
                    >
                      <Typography variant="caption" color="textSecondary">
                        {t('deviceNetwork.oneByOne', 'Added one by one')}
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
                      listedCount={listedOf(member)}
                      alsoTagged={alsoTagged(member.deviceId).map(rule => tagsText(t, rule))}
                      editable={manage && !link && !busy}
                      onReach={reach => setReach(member, reach)}
                      onReached={reached => setReached(member, reached)}
                      onService={serviceId => setService(member, serviceId)}
                      onRemove={() => act(() => graphQLRemoveNetworkDevice(network.id, member.deviceId))}
                    />
                  ))}
                  {!account.members.length && !account.rules.length && (
                    <EmptyLine
                      text={t('deviceNetwork.noAccountDevices', 'No devices from {{account}} yet.', {
                        account: account.name,
                      })}
                    />
                  )}
                </React.Fragment>
              )
            })}
          {!link && !!others.length && (
            <Box sx={{ paddingX: 2, paddingY: 1, borderTop: 1, borderColor: 'grayLight.main' }}>
              {adding === 'account' ? (
                <TextField
                  variant="filled"
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
                <Button size="small" onClick={() => setAdding('account')}>
                  {t('deviceNetwork.addFromAccount', 'Add from another account')}
                </Button>
              )}
            </Box>
          )}
          <NetworkExits network={network} accountId={accountId} />
        </List>
      ) : (
        <List disablePadding>
          {admin && (
            <ListSubheader sx={{ display: 'flex', alignItems: 'center' }}>
              <Button
                size="small"
                sx={{ marginLeft: 'auto' }}
                onClick={() => history.push(`/networks/${network.id}/share`)}
                startIcon={<Icon name="user-plus" size="sm" inline />}
              >
                {t('deviceNetwork.share', 'Add person')}
              </Button>
            </ListSubheader>
          )}
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
              detail={peopleText(t, individuals.length)}
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
            <Box sx={{ paddingX: `${spacing.xl}px`, paddingY: 1, borderTop: 1, borderColor: 'grayLighter.main' }}>
              <Typography variant="caption" color="textSecondary">
                {t('deviceNetwork.rolesNote', 'Roles decide which people in an organization reach this network.')}{' '}
                <Link to="/organization/roles">{t('deviceNetwork.editRoles', 'Edit roles')}</Link>
              </Typography>
            </Box>
          )}
        </List>
      )}
    </Container>
  )
}

const EmptyLine: React.FC<{ text: string }> = ({ text }) => (
  <Box sx={{ paddingX: 2, paddingLeft: GROUP_INDENT, paddingY: 1.25, borderTop: 1, borderColor: 'grayLighter.main' }}>
    <Typography variant="body2" color="textSecondary">
      {text}
    </Typography>
  </Box>
)

const EmptyNetwork: React.FC<{ text: string; action?: React.ReactNode }> = ({ text, action }) => (
  <Gutters>
    <Box
      sx={{
        border: 1,
        borderStyle: 'dashed',
        borderColor: 'grayLight.main',
        borderRadius: 2,
        paddingX: 3,
        paddingY: 5,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <Icon name="chart-network" size="xxl" color="grayLight" type="light" />
      <Typography variant="body2" color="textSecondary" sx={{ maxWidth: 360 }}>
        {text}
      </Typography>
      {action}
    </Box>
  </Gutters>
)

type AddChoice = { id: string; name: string; account?: string }
type TagChoice = { accountId: string; account?: string; tag: string }

const AddPanel: React.FC<{
  kind: 'device' | 'tag'
  fixed?: boolean // from one account's heading
  devices: AddChoice[]
  tagChoices: TagChoice[]
  onKind: (kind: 'device' | 'tag') => void
  onDevice: (deviceId: string) => void
  onTag: (accountId: string, tag: string) => void
  onCancel: () => void
}> = ({ kind, fixed, devices, tagChoices, onKind, onDevice, onTag, onCancel }) => {
  const { t } = useTranslation()
  const manyAccounts = new Set(devices.map(device => device.account)).size > 1
  const manyTagAccounts = new Set(tagChoices.map(choice => choice.accountId)).size > 1
  return (
    <Box
      sx={{
        paddingX: 2,
        paddingLeft: GROUP_INDENT,
        paddingY: 1.5,
        bgcolor: 'primaryHighlight.main',
        borderTop: 1,
        borderColor: 'grayLighter.main',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      {kind === 'device' ? (
        <TextField
          variant="filled"
          select
          fullWidth
          size="small"
          autoFocus
          label={t('deviceNetwork.chooseDevice', 'Device to add')}
          value=""
          onChange={event => onDevice(String(event.target.value))}
          SelectProps={{ defaultOpen: !fixed }}
        >
          {[...devices]
            .sort((a, b) => (a.account || '').localeCompare(b.account || '') || a.name.localeCompare(b.name))
            .map(device => (
              <MenuItem key={device.id} value={device.id}>
                {device.name}
                {manyAccounts && (
                  <Typography variant="caption" color="textSecondary" sx={{ marginLeft: 1 }}>
                    {device.account}
                  </Typography>
                )}
              </MenuItem>
            ))}
        </TextField>
      ) : (
        <TextField
          variant="filled"
          select
          fullWidth
          size="small"
          label={t('deviceNetwork.chooseTag', 'Add every device tagged')}
          value=""
          onChange={event => {
            const [accountId, tag] = String(event.target.value).split('\u0000')
            onTag(accountId, tag)
          }}
        >
          {tagChoices.map(choice => (
            <MenuItem key={`${choice.accountId}/${choice.tag}`} value={`${choice.accountId}\u0000${choice.tag}`}>
              {choice.tag}
              {manyTagAccounts && (
                <Typography variant="caption" color="textSecondary" sx={{ marginLeft: 1 }}>
                  {choice.account}
                </Typography>
              )}
            </MenuItem>
          ))}
        </TextField>
      )}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {kind === 'device' && !!tagChoices.length && (
          <Button size="small" onClick={() => onKind('tag')} startIcon={<Icon name="tag" size="sm" inline />}>
            {t('deviceNetwork.addByTagInstead', 'Add devices by tag instead')}
          </Button>
        )}
        {kind === 'tag' && !!devices.length && (
          <Button size="small" onClick={() => onKind('device')} startIcon={<Icon name="laptop" size="sm" inline />}>
            {t('deviceNetwork.addOneInstead', 'Add one device instead')}
          </Button>
        )}
        <Button size="small" color="inherit" onClick={onCancel} sx={{ marginLeft: 'auto' }}>
          {t('deviceNetwork.cancel', 'Cancel')}
        </Button>
      </Box>
    </Box>
  )
}

// Shown in place up to this many services; past it, the first SHOWN and a count, with a filter past FILTER.
const INLINE = 8
const SHOWN = 6
const FILTER = 10
const NAME_WIDTH = 180
const SELECT = { '& .MuiInputBase-input': { fontSize: 14 } }
const GROUP_INDENT = 4
const ROW_INDENT = 4

const ReachSelect: React.FC<{ value: boolean; disabled: boolean; onChange: (reach: boolean) => void }> = ({
  value,
  disabled,
  onChange,
}) => {
  const { t } = useTranslation()
  return (
    <TextField
      variant="filled"
      select
      size="small"
      label={t('deviceNetwork.canReach', 'Can reach')}
      value={value ? 'ALL' : 'NOTHING'}
      disabled={disabled}
      onChange={event => onChange(event.target.value === 'ALL')}
      sx={{ minWidth: 0, flex: '1 1 120px', ...SELECT }}
    >
      <MenuItem value="NOTHING">{t('deviceNetwork.nothing', 'Nothing')}</MenuItem>
      <MenuItem value="ALL">{t('deviceNetwork.reachAll', 'All services')}</MenuItem>
    </TextField>
  )
}

const ReachedSelect: React.FC<{
  value: Reached
  disabled: boolean
  chosen: boolean // offer Chosen services
  onChange: (reached: Reached) => void
}> = ({ value, disabled, chosen, onChange }) => {
  const { t } = useTranslation()
  return (
    <TextField
      variant="filled"
      select
      size="small"
      label={t('deviceNetwork.canBeReached', 'Can be reached')}
      value={value}
      disabled={disabled}
      onChange={event => onChange(event.target.value as Reached)}
      sx={{ minWidth: 0, flex: '1.4 1 160px', ...SELECT }}
    >
      <MenuItem value="NOTHING">{t('deviceNetwork.nothing', 'Nothing')}</MenuItem>
      <MenuItem value="ALL">{t('deviceNetwork.allServices', 'All services')}</MenuItem>
      <MenuItem value="ALL_ANY_PORT">{t('deviceNetwork.allAnyPort', 'All services and any port')}</MenuItem>
      {chosen && <MenuItem value="CHOSEN">{t('deviceNetwork.chosen', 'Chosen services')}</MenuItem>}
    </TextField>
  )
}

export const MemberRow: React.FC<{
  name: string
  member: NetworkMember
  services: ServiceRef[]
  listed: Set<string>
  listedCount: number
  alsoTagged: string[]
  editable: boolean
  onReach: (reach: boolean) => void
  onReached: (reached: Reached) => void
  onService: (serviceId: string) => void
  onRemove: () => void
}> = ({ name, member, services, listed, listedCount, alsoTagged, editable, ...on }) => {
  const { t } = useTranslation()
  const [choosing, setChoosing] = useState(false)
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('')
  // A membership its device's product holds is the product's: graphql refuses its role here. The services the network
  // lists stay the network's, one by one.
  const held = !!member.fromProduct
  const membership = editable && !held
  const stored = reachedOf(member, listedCount)
  const reached: Reached = choosing && stored === 'NOTHING' ? 'CHOSEN' : stored
  const reach = canReach(member)
  const chipsEditable = editable && (membership || targeted(member))

  const folded = services.length > INLINE && !open
  const hidden = folded ? services.slice(SHOWN) : []
  const shown = folded
    ? services.slice(0, SHOWN)
    : services.filter(s => s.name.toLowerCase().includes(filter.toLowerCase()))

  const notes = [
    held && t('deviceNetwork.fromProduct', 'Set by its product'),
    !!alsoTagged.length &&
      t('deviceNetwork.alsoTagged', '{{name}} is also tagged {{tags}}. The settings here apply, not the tag rule.', {
        tags: alsoTagged.join(', '),
        name,
      }),
    !reach &&
      reached === 'NOTHING' &&
      !choosing &&
      t('deviceNetwork.notSetUp', 'Not set up yet. Choose what {{name}} can reach or how it can be reached.', { name }),
  ].filter(Boolean) as string[]

  return (
    <Box
      data-member={member.deviceId}
      sx={{
        position: 'relative',
        paddingLeft: ROW_INDENT,
        paddingRight: 9,
        paddingY: 1.5,
        borderTop: 1,
        borderColor: 'grayLighter.main',
      }}
    >
      {membership && (
        <Box sx={{ position: 'absolute', right: 28, top: 14 }}>
          <IconButton
            icon="times"
            title={t('deviceNetwork.remove', 'Remove {{name}} from this network', { name })}
            size="sm"
            onClick={on.onRemove}
          />
        </Box>
      )}
      <Box sx={{ display: 'flex', columnGap: 2, rowGap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
        <Box sx={{ flex: `1 1 ${NAME_WIDTH}px`, minWidth: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Icon name="laptop" size="sm" color="grayDark" />
          <Typography variant="body2" noWrap sx={{ fontWeight: 500 }} title={name}>
            {name}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flex: '10 1 300px', minWidth: 0, alignItems: 'center' }}>
          <ReachSelect value={reach} disabled={!membership} onChange={on.onReach} />
          <ReachedSelect
            value={reached}
            disabled={!membership}
            chosen={!!services.length || reached === 'CHOSEN'}
            onChange={next => {
              setChoosing(next === 'CHOSEN')
              if (next === 'CHOSEN' && stored === 'NOTHING') return
              if (next !== stored) on.onReached(next)
            }}
          />
        </Box>
      </Box>
      {reached === 'CHOSEN' && (
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'center', marginTop: 1 }}>
          <Typography variant="caption" color="textSecondary" sx={{ marginRight: 0.5 }}>
            {t('deviceNetwork.chosenLabel', 'Reached on')}
          </Typography>
          {open && services.length > FILTER && (
            <TextField
              variant="filled"
              size="small"
              fullWidth
              placeholder={t('deviceNetwork.filterServices', 'Filter {{count}} services', { count: services.length })}
              value={filter}
              onChange={event => setFilter(event.target.value)}
            />
          )}
          {shown.map(service => (
            <Chip
              key={service.id}
              size="small"
              label={service.name}
              color={listed.has(service.id) ? 'primary' : 'default'}
              icon={listed.has(service.id) ? <Icon name="check" size="xxs" inline /> : undefined}
              onClick={chipsEditable ? () => on.onService(service.id) : undefined}
            />
          ))}
          {folded && (
            <Chip
              size="small"
              onClick={() => setOpen(true)}
              label={
                hidden.some(service => listed.has(service.id))
                  ? t('deviceNetwork.moreSelected', '{{count}} more · {{selected}} chosen', {
                      count: hidden.length,
                      selected: hidden.filter(service => listed.has(service.id)).length,
                    })
                  : t('deviceNetwork.more', '{{count}} more', { count: hidden.length })
              }
            />
          )}
          {open && services.length > INLINE && (
            <Button
              size="small"
              onClick={() => {
                setOpen(false)
                setFilter('')
              }}
            >
              {t('deviceNetwork.showLess', 'Show less')}
            </Button>
          )}
        </Box>
      )}
      {!!notes.length && (
        <Box sx={{ marginTop: 0.75 }}>
          {notes.map(note => (
            <Typography key={note} variant="caption" color="textSecondary" component="div">
              {note}
            </Typography>
          ))}
        </Box>
      )}
    </Box>
  )
}

/* Devices by tag: what the rule does as a sentence, its two controls, and the devices it adds. A device it matches
   that is set on its own is named: its own settings apply. */
const TagRule: React.FC<{
  rule: NetworkRule
  tags: ITag[] // the active account's, for colours: empty for another account's rule
  choices: string[] // the tag names its account has, to add
  nameOf: (id: string) => string
  editable: boolean
  removable: boolean
  onChange: (set: RuleChoices) => void
  onRemove: () => void
}> = ({ rule, tags, choices, nameOf, editable, removable, onChange, onRemove }) => {
  const { t } = useTranslation()
  const [picking, setPicking] = useState(false)
  const [open, setOpen] = useState(false)
  const colorOf = (name: string) =>
    rule.tagColors?.find(tag => tag.name === name)?.color ?? tags.find(tag => tag.name === name)?.color ?? 0
  const devices = [...rule.devices].sort((a, b) => nameOf(a).localeCompare(nameOf(b)))
  const shown = open ? devices : devices.slice(0, INLINE)

  return (
    <Box
      data-rule={rule.id}
      sx={{ paddingX: 2, paddingLeft: ROW_INDENT, paddingY: 1.5, borderTop: 1, borderColor: 'grayLighter.main' }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <Icon name="tag" size="sm" color="grayDark" />
        <Typography variant="body2" sx={{ fontWeight: 500, flex: 1 }} data-rule-sentence>
          {ruleSentence(t, rule)}
        </Typography>
        {(editable || removable) && (
          <IconButton
            icon="times"
            title={t('deviceNetwork.removeRule', 'Stop adding devices by these tags')}
            size="sm"
            onClick={onRemove}
          />
        )}
      </Box>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', marginTop: 1, paddingLeft: 3 }}>
        {rule.tags.map(tag => (
          <Tag
            key={tag}
            tag={{ name: tag, color: colorOf(tag) }}
            onDelete={
              editable && rule.tags.length > 1
                ? () => onChange({ tags: rule.tags.filter(name => name !== tag) })
                : undefined
            }
          />
        ))}
        {editable && !!choices.filter(tag => !rule.tags.includes(tag)).length && (
          <Button size="small" onClick={() => setPicking(!picking)}>
            {t('deviceNetwork.addTag', 'Add tag')}
          </Button>
        )}
      </Box>
      {picking && (
        <Box sx={{ paddingLeft: 3, marginTop: 1 }}>
          <TextField
            variant="filled"
            select
            fullWidth
            size="small"
            value=""
            label={t('deviceNetwork.chooseTagToAdd', 'Tag')}
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
        </Box>
      )}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', marginTop: 1.5, paddingLeft: 3 }}>
        <ReachSelect value={rule.initiator} disabled={!editable} onChange={initiator => onChange({ initiator })} />
        <ReachedSelect
          value={ruleReachedOf(rule)}
          disabled={!editable}
          chosen={false}
          onChange={reached => reached !== 'CHOSEN' && onChange(ruleChoicesFor(reached))}
        />
        {rule.tags.length > 1 && (
          <TextField
            variant="filled"
            select
            size="small"
            label={t('deviceNetwork.match', 'Match')}
            value={rule.operator}
            disabled={!editable}
            onChange={event => onChange({ operator: event.target.value as NetworkRule['operator'] })}
            sx={{ minWidth: 150, flex: '1 1 150px', ...SELECT }}
          >
            <MenuItem value="ANY">{t('deviceNetwork.anyTag', 'Any of these tags')}</MenuItem>
            <MenuItem value="ALL">{t('deviceNetwork.allTags', 'All of these tags')}</MenuItem>
          </TextField>
        )}
      </Box>
      {!rule.holds && (
        <Notice severity="warning" fullWidth sx={{ marginTop: 1.5 }}>
          {t(
            'deviceNetwork.ruleStopped',
            '{{account}} devices left this network. {{email}} no longer administers {{account}}.',
            {
              email: rule.addedByEmail || t('deviceNetwork.someone', 'The person who added them'),
              account: rule.accountName,
            }
          )}{' '}
          {t('deviceNetwork.ruleStoppedFix', 'Ask someone who administers both accounts to add them again.')}
        </Notice>
      )}
      <Box sx={{ paddingLeft: 3, marginTop: 1.25 }}>
        <Typography variant="caption" color="textSecondary" component="div">
          {!rule.holds
            ? null
            : !devices.length
            ? t('deviceNetwork.noMatches', 'No devices have these tags yet.')
            : t('deviceNetwork.ruleAdds', 'Adds {{devices}}', { devices: devicesText(t, devices.length) })}
        </Typography>
        {!!devices.length && (
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', marginTop: 0.75 }}>
            {shown.map(id => (
              <Chip key={id} size="small" icon={<Icon name="laptop" size="xxs" inline />} label={nameOf(id)} />
            ))}
            {devices.length > INLINE && (
              <Chip
                size="small"
                onClick={() => setOpen(!open)}
                label={
                  open
                    ? t('deviceNetwork.showLess', 'Show less')
                    : t('deviceNetwork.more', '{{count}} more', { count: devices.length - INLINE })
                }
              />
            )}
          </Box>
        )}
        {rule.overridden.map(id => (
          <Typography key={id} variant="caption" color="textSecondary" component="div" sx={{ marginTop: 0.75 }}>
            {t('deviceNetwork.overridden', '{{name}} has these tags, but is set on its own below.', {
              name: nameOf(id),
            })}
          </Typography>
        ))}
      </Box>
    </Box>
  )
}

/* A person the network is shared with, or its owner, beside their devices with full access as them: those reach
   everything the person can, this network's devices with the rest. Removing a person unshares the network with them. */
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
            ? t('deviceNetwork.deviceFullAccess', '1 device with full access')
            : devices.length
            ? t('deviceNetwork.devicesFullAccess', '{{count}} devices with full access', { count: devices.length })
            : t('deviceNetwork.noFullAccess', 'No devices with full access')}
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
                label={t('deviceNetwork.more', '{{count}} more', { count: devices.length - SHOWN })}
                onClick={() => setOpen(true)}
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

type NetworkView = 'map' | 'devices' | 'people'

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
      flexWrap: 'wrap',
      columnGap: 1,
      paddingLeft: 2,
      paddingRight: 3.5,
      paddingY: 1,
      borderTop: 1,
      borderColor: 'grayLight.main',
      bgcolor: color.background,
      color: color.text,
    }}
  >
    <Icon name={icon} size="sm" color={color.text} />
    <Typography variant="body1" sx={{ fontWeight: 500, color: 'inherit', minWidth: 0 }} noWrap>
      {name}
    </Typography>
    {detail && (
      <Typography
        variant="caption"
        component="div"
        sx={{ color: 'inherit', opacity: 0.85, display: 'flex', alignItems: 'center', gap: 0.5, whiteSpace: 'nowrap' }}
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
  const count = new Set([section.accountId, ...section.roles.flatMap(role => role.members.map(member => member.id))])
    .size
  const people = peopleText(t, count)
  return (
    <>
      <AccountHeadingBand
        icon="building"
        name={section.accountName}
        color={color}
        detail={
          section.owner ? (
            <>
              {t('deviceNetwork.owner', 'Owner')} · {people}
            </>
          ) : (
            <>
              {t('deviceNetwork.sharedUpTo', 'Shared, up to')}{' '}
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
          label={t('deviceNetwork.taggedIn', 'Tags on this network')}
          names={section.tags.map(tag => tag.name)}
          colorOf={name => section.tags.find(tag => tag.name === name)?.color ?? 0}
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
        caption={section.owner ? undefined : t('deviceNetwork.accountOwner', 'Account owner')}
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

/* An account's tags on the network: an organization role with access by tag reaches the networks carrying its tags,
   so they decide which of its members reach this one. That account's administrators change them. */
const NetworkTags: React.FC<{
  label: string
  names: string[]
  colorOf: (name: string) => number
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
          <Tag key={name} tag={{ name, color: colorOf(name) }} onDelete={editable ? () => onRemove(name) : undefined} />
        ))}
        {editable && (
          <Chip
            size="small"
            label={
              <>
                <Icon name="plus" size="sm" inlineLeft />
                {t('deviceNetwork.addTag', 'Add tag')}
              </>
            }
            sx={{ fontWeight: 500, letterSpacing: 1, color: 'grayDarker.main' }}
            onClick={() => setPicking(!picking)}
          />
        )}
        {!names.length && (
          <Typography variant="caption" color="textSecondary">
            {t('deviceNetwork.noNetworkTags', 'None')}
          </Typography>
        )}
      </Box>
      {picking && (
        <TextField
          variant="filled"
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
            · {peopleText(t, count)}
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
              : t('deviceNetwork.morePeople', '{{count}} more people', { count: count - INLINE })}
          </Typography>
        </Box>
      )}
    </Box>
  )
}
