import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import {
  Box,
  Button,
  Chip,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material'
import { Container } from '../../components/Container'
import { Gutters } from '../../components/Gutters'
import { Link } from '../../components/Link'
import { LoadingMessage } from '../../components/LoadingMessage'
import { Notice } from '../../components/Notice'
import { IconButton } from '../../buttons/IconButton'
import { UNSUPPORTED } from '../../services/graphQLDaemon'
import {
  FLEET_DIMENSIONS,
  FleetCount,
  FleetDevices,
  FleetRow,
  FleetVersions,
  NONE,
  VERSION_OF,
} from '../../services/fleetVersionsModel'
import { graphQLFleetDevices, graphQLFleetVersions } from '../../services/graphQLFleetVersions'
import { UpgradesTabs } from './UpgradesTabs'
import { UPGRADES_ROUTE, dateTime } from './rolloutHelpers'
import {
  FleetChoices,
  MatrixColumn,
  behindShade,
  cellOf,
  groupByOf,
  matrixColumns,
  onlineTitle,
  readChoices,
  shownCount,
  versionsOf,
  writeChoices,
} from './fleetHelpers'

export const DRILL_LIMIT = 200

type Drill = { row: FleetRow | null; column: MatrixColumn | null; title: string }

const headSx = { fontWeight: 600, whiteSpace: 'nowrap', paddingX: 1, paddingY: 0.5 } as const
const cellSx = { whiteSpace: 'nowrap', paddingX: 1, paddingY: 0.25, textAlign: 'right', fontVariantNumeric: 'tabular-nums' } as const

/* The fleet's versions (admin): a matrix of device groups by the version they run, newest on the left — the current
   and candidate releases labelled, each older version a darker amber the further behind, the oldest folded into
   "older" — each cell its devices (click for the list, hover for online and offline). The choices live in the URL. */
export const AdminFleetTab: React.FC = () => {
  const history = useHistory()
  const location = useLocation()
  const choices = useMemo(() => readChoices(location.search), [location.search])
  const [view, setView] = useState<FleetVersions | 'ERROR' | typeof UNSUPPORTED>()
  const [loading, setLoading] = useState(false)
  const [drill, setDrill] = useState<Drill>()
  const [devices, setDevices] = useState<FleetDevices | 'ERROR' | typeof UNSUPPORTED>()
  const [search, setSearch] = useState(choices.search)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const choose = (change: Partial<FleetChoices>) =>
    history.replace(`${UPGRADES_ROUTE}${writeChoices({ ...choices, ...change })}`)

  const query = useMemo(
    () => ({
      groupBy: groupByOf(choices),
      versionOf: choices.of,
      onlineOnly: choices.online,
      accountSearch: choices.search || undefined,
    }),
    [choices.group, choices.then, choices.of, choices.online, choices.search]
  )

  const load = useCallback(async () => {
    setLoading(true)
    const next = await graphQLFleetVersions(query)
    if (!mounted.current) return
    setView(next)
    setLoading(false)
  }, [query])

  useEffect(() => {
    setDrill(undefined)
    load()
  }, [load])

  useEffect(() => setSearch(choices.search), [choices.search])

  const open = async (next: Drill) => {
    setDrill(next)
    setDevices(undefined)
    const page = await graphQLFleetDevices({
      ...query,
      values: next.row?.values || [],
      versions: next.column ? versionsOf(next.column) : undefined,
      limit: DRILL_LIMIT,
    })
    if (mounted.current) setDevices(page)
  }

  const grouped = groupByOf(choices).includes('account')
  const header = (
    <Gutters>
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
        <Typography variant="h2">Upgrades</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="caption" color="textSecondary">
            {view && typeof view === 'object' ? `counted ${dateTime(view.checked)}` : ''}
          </Typography>
          <IconButton icon="sync" title="Refresh" onClick={load} spin={loading} size="md" />
        </Stack>
      </Stack>
      <UpgradesTabs value="fleet" />
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ marginTop: 1 }}>
        <TextField
          select
          size="small"
          label="Group by"
          value={choices.group}
          onChange={e => choose({ group: e.target.value as FleetChoices['group'], then: undefined })}
          inputProps={{ 'data-choice': 'group' }}
        >
          {FLEET_DIMENSIONS.map(d => (
            <MenuItem key={d.key} value={d.key}>
              {d.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Then by"
          value={choices.then || ''}
          onChange={e => choose({ then: (e.target.value || undefined) as FleetChoices['then'] })}
          inputProps={{ 'data-choice': 'then' }}
        >
          <MenuItem value="">
            <em>nothing</em>
          </MenuItem>
          {FLEET_DIMENSIONS.filter(d => d.key !== choices.group).map(d => (
            <MenuItem key={d.key} value={d.key}>
              {d.label}
            </MenuItem>
          ))}
        </TextField>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={choices.of}
          onChange={(_, value) => value && choose({ of: value })}
          aria-label="Version of"
        >
          {VERSION_OF.map(v => (
            <ToggleButton key={v.key} value={v.key} disabled={'disabled' in v} title={v.help} data-version-of={v.key}>
              {v.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={choices.online ? 'online' : 'all'}
          onChange={(_, value) => value && choose({ online: value === 'online' })}
          aria-label="Show"
        >
          <ToggleButton value="all" data-show="all">
            All
          </ToggleButton>
          <ToggleButton value="online" data-show="online">
            Online
          </ToggleButton>
        </ToggleButtonGroup>
        <ToggleButton
          size="small"
          value="percent"
          selected={choices.percent}
          onChange={() => choose({ percent: !choices.percent })}
          data-percent
          title="Each row as percentages of its total"
        >
          %
        </ToggleButton>
        {(grouped || choices.search) && (
          <TextField
            size="small"
            label="Account email or name"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onBlur={() => search !== choices.search && choose({ search })}
            onKeyDown={e => e.key === 'Enter' && choose({ search })}
            inputProps={{ 'data-account-search': true }}
          />
        )}
      </Stack>
    </Gutters>
  )

  if (view === undefined) return <LoadingMessage message="Counting the fleet..." />

  if (view === UNSUPPORTED)
    return (
      <Container integrated gutterBottom header={header}>
        <Gutters>
          <Notice severity="info" fullWidth>
            This API has no fleet view yet.
            <em>The Fleet tab appears once graphql serves fleetVersions.</em>
          </Notice>
        </Gutters>
      </Container>
    )

  if (view === 'ERROR')
    return (
      <Container integrated gutterBottom header={header}>
        <Gutters>
          <Notice severity="error" fullWidth>
            Could not count the fleet.
          </Notice>
        </Gutters>
      </Container>
    )

  return (
    <Container integrated gutterBottom bodyProps={{ verticalOverflow: true, horizontalOverflow: true }} header={header}>
      <Gutters>
        <FleetMatrix
          view={view}
          choices={choices}
          onExpand={() => choose({ older: !choices.older })}
          onOpen={open}
          drill={drill}
        />
        {drill && <FleetDrill drill={drill} devices={devices} onClose={() => setDrill(undefined)} />}
      </Gutters>
    </Container>
  )
}

const FleetMatrix: React.FC<{
  view: FleetVersions
  choices: FleetChoices
  onExpand: () => void
  onOpen: (drill: Drill) => void
  drill?: Drill
}> = ({ view, choices, onExpand, onOpen, drill }) => {
  const columns = matrixColumns(view.columns, choices.older)
  const folded = view.columns.filter(c => c.version !== NONE).length - columns.filter(c => c.kind === 'version').length
  const totals: FleetRow = {
    key: '',
    values: [],
    label: 'Total',
    dimension: '',
    depth: 0,
    total: view.totals.devices,
    online: view.totals.online,
    cells: view.columns,
  }
  const versionLabel = (column: MatrixColumn) =>
    column.kind === 'older' ? `older (${column.versions.length})` : column.kind === 'none' ? 'none' : column.key
  const shade = (column: MatrixColumn) =>
    behindShade(column.kind === 'older' ? column.behind : column.kind === 'version' ? column.column.behind : null)
  const active = (row: FleetRow | null, column: MatrixColumn | null) =>
    !!drill && drill.row?.key === row?.key && drill.column?.key === column?.key

  const count = (row: FleetRow, column: MatrixColumn | null, isTotal = false) => {
    const value: FleetCount = column ? cellOf(row, column) : { version: '', devices: row.total, online: row.online }
    const target = isTotal ? null : row
    const title = `${row.label}${column ? ` · ${versionLabel(column)}` : ''}`
    return (
      <TableCell
        key={column?.key || 'total'}
        sx={{
          ...cellSx,
          backgroundColor: column ? shade(column) : undefined,
          fontWeight: isTotal || !column ? 600 : undefined,
          outline: active(target, column) ? '2px solid' : undefined,
          outlineColor: 'primary.main',
        }}
        data-cell={`${row.key}|${column?.key || 'total'}`}
      >
        {value.devices ? (
          <Tooltip title={onlineTitle(value)}>
            <Box
              component="span"
              role="button"
              sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
              onClick={() => onOpen({ row: target, column, title })}
            >
              {shownCount(value.devices, row.total, choices.percent && !!column)}
            </Box>
          </Tooltip>
        ) : (
          <Typography component="span" variant="caption" color="grayLight.main">
            ·
          </Typography>
        )}
      </TableCell>
    )
  }

  return (
    <Box sx={{ overflowX: 'auto', marginBottom: 2 }} data-fleet-matrix>
      {choices.older && folded === 0 && matrixColumns(view.columns, false).some(c => c.kind === 'older') && (
        <Button size="small" onClick={onExpand} data-collapse-older>
          ◂ Fold the older versions
        </Button>
      )}
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ ...headSx, position: 'sticky', left: 0, zIndex: 3, backgroundColor: 'white.main' }}>
              {groupByOf(choices)
                .map(key => FLEET_DIMENSIONS.find(d => d.key === key)?.label)
                .join(' › ')}
            </TableCell>
            <TableCell sx={{ ...headSx, textAlign: 'right' }}>Total</TableCell>
            {columns.map(column => (
              <TableCell
                key={column.key}
                sx={{ ...headSx, textAlign: 'right', backgroundColor: shade(column) }}
                data-column={column.key}
              >
                {column.kind === 'older' ? (
                  <Button size="small" onClick={onExpand} sx={{ minWidth: 0, padding: 0 }} data-expand-older>
                    {versionLabel(column)} ▸
                  </Button>
                ) : (
                  <Box>{versionLabel(column)}</Box>
                )}
                {column.kind === 'version' && column.column.label && (
                  <Chip
                    size="small"
                    color={/candidate/.test(column.column.label) ? 'primary' : undefined}
                    variant={/candidate/.test(column.column.label) ? 'filled' : 'outlined'}
                    label={column.column.label}
                    sx={{ marginTop: 0.25 }}
                  />
                )}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {view.rows.map(row => (
            <TableRow key={row.key} hover data-row={row.key}>
              <TableCell
                sx={{
                  ...headSx,
                  fontWeight: row.depth ? 400 : 600,
                  paddingLeft: row.depth ? 3 : 1,
                  position: 'sticky',
                  left: 0,
                  zIndex: 1,
                  backgroundColor: 'white.main',
                  maxWidth: 320,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={row.label}
              >
                {row.label}
              </TableCell>
              {count(row, null)}
              {columns.map(column => count(row, column))}
            </TableRow>
          ))}
          <TableRow data-row="totals">
            <TableCell sx={{ ...headSx, position: 'sticky', left: 0, backgroundColor: 'white.main' }}>Total</TableCell>
            {count(totals, null, true)}
            {columns.map(column => count({ ...totals, total: view.totals.devices }, column, true))}
          </TableRow>
        </TableBody>
      </Table>
      {!view.rows.length && (
        <Notice severity="info" fullWidth>
          No devices{choices.online ? ' online' : ''}.
        </Notice>
      )}
    </Box>
  )
}

const FleetDrill: React.FC<{ drill: Drill; devices?: FleetDevices | 'ERROR' | typeof UNSUPPORTED; onClose: () => void }> = ({
  drill,
  devices,
  onClose,
}) => (
  <Box sx={{ border: 1, borderColor: 'grayLight.main', borderRadius: 2, padding: 1.5, marginBottom: 2 }} data-drill>
    <Stack direction="row" alignItems="center" justifyContent="space-between">
      <Typography variant="h3">{drill.title}</Typography>
      <Button size="small" onClick={onClose}>
        Close
      </Button>
    </Stack>
    {devices === undefined ? (
      <LoadingMessage message="Loading devices..." />
    ) : devices === 'ERROR' || devices === UNSUPPORTED ? (
      <Notice severity="error" fullWidth>
        Could not read the devices.
      </Notice>
    ) : (
      <>
        <Typography variant="caption" color="textSecondary" component="div" sx={{ marginBottom: 1 }}>
          {devices.devices.length < devices.total
            ? `The first ${devices.devices.length.toLocaleString()} of ${devices.total.toLocaleString()}, online first`
            : `${devices.total.toLocaleString()} devices`}
        </Typography>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Device', 'Version', 'Status', 'Package', 'OS', 'Account', 'Release'].map(title => (
                  <TableCell key={title} sx={headSx}>
                    {title}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {devices.devices.map(device => (
                <TableRow key={device.id} data-device={device.id}>
                  <TableCell sx={{ paddingX: 1 }}>
                    <Link to={`/admin/devices/${device.id}`}>{device.name || device.id}</Link>
                    <Typography variant="caption" color="textSecondary" component="div">
                      {device.id}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ paddingX: 1, whiteSpace: 'nowrap' }}>{device.version}</TableCell>
                  <TableCell sx={{ paddingX: 1, whiteSpace: 'nowrap' }}>{device.lastSeen}</TableCell>
                  <TableCell sx={{ paddingX: 1, whiteSpace: 'nowrap' }}>
                    {device.packageType}
                    {device.package && device.package !== device.version ? ` ${device.package}` : ''}
                  </TableCell>
                  <TableCell sx={{ paddingX: 1 }}>{[device.os, device.arch].filter(Boolean).join(' · ') || '—'}</TableCell>
                  <TableCell sx={{ paddingX: 1 }}>{device.account || device.accountId || '—'}</TableCell>
                  <TableCell sx={{ paddingX: 1 }}>
                    {device.release}
                    <Typography variant="caption" color="textSecondary" component="div">
                      {device.managed}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </>
    )}
  </Box>
)
