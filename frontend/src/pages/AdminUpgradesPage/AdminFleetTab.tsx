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
  CLASSIC,
  CONTROL_LINK,
  DimensionChoice,
  FEATURES,
  FleetCount,
  FleetDevice,
  FleetDevices,
  FleetDimension,
  FleetRow,
  FleetVersions,
  HELD,
  VERSION_OF,
  dimensionLabel,
  distributionName,
  featureOf,
  fleetDimensions,
  formatName,
  isFeature,
  managedText,
  rowName,
  shownVersion,
  updatedByName,
  userText,
} from '../../services/fleetVersionsModel'
import { graphQLFleetDevices, graphQLFleetFields, graphQLFleetVersions } from '../../services/graphQLFleetVersions'
import { UpgradesTabs } from './UpgradesTabs'
import { UPGRADES_ROUTE, dateTime } from './rolloutHelpers'
import {
  FleetChoices,
  MatrixColumn,
  behindShade,
  cellOf,
  choiceOf,
  columnHeading,
  featureDimension,
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

// Both groupings as wide as their label and longest choice: a select is otherwise as wide as what it shows.
const selectSx = { minWidth: 240, maxWidth: '100%' } as const
const headSx = { fontWeight: 600, whiteSpace: 'nowrap', paddingX: 1, paddingY: 0.5 } as const
const cellSx = { whiteSpace: 'nowrap', paddingX: 1, paddingY: 0.25, textAlign: 'right', fontVariantNumeric: 'tabular-nums' } as const

// A menu entry as a grouping: Feature as its first feature (another than the first grouping's).
const dimensionFor = (value: string, exclude?: FleetDimension): FleetDimension =>
  value === 'feature' ? featureDimension(FEATURES.find(f => featureDimension(f) !== exclude)) : (value as FleetDimension)

// Which feature a Feature grouping counts: "supports X" and not.
const FeaturePicker: React.FC<{
  value: FleetDimension
  name: 'group' | 'then'
  exclude?: FleetDimension
  onChange: (value: FleetDimension) => void
}> = ({ value, name, exclude, onChange }) => {
  const current = featureOf(value)
  const names = FEATURES.includes(current) ? FEATURES : [...FEATURES, current]
  return (
    <TextField
      select
      size="small"
      label="Feature"
      value={current}
      sx={{ minWidth: 180 }}
      InputLabelProps={{ shrink: true }}
      onChange={e => onChange(featureDimension(e.target.value))}
      inputProps={{ 'data-feature': name }}
    >
      {names
        .filter(feature => featureDimension(feature) !== exclude)
        .map(feature => (
          <MenuItem key={feature} value={feature}>
            {feature}
          </MenuItem>
        ))}
    </TextField>
  )
}

/* The fleet's versions (admin): a matrix of device groups by the version they run, newest on the left — the current
   and candidate releases labelled, each older version a darker amber the further behind, the oldest folded into
   "older" — each cell its devices (click for the list, hover for online and offline). The choices live in the URL. */
export const AdminFleetTab: React.FC = () => {
  const history = useHistory()
  const location = useLocation()
  // Which groupings this API serves, read from its schema before the first count: the default grouping depends on it.
  const [fields, setFields] = useState<Set<string>>()
  const dimensions = useMemo(() => fleetDimensions(fields), [fields])
  const choices = useMemo(() => readChoices(location.search, dimensions), [location.search, dimensions])
  const [view, setView] = useState<FleetVersions | 'ERROR' | typeof UNSUPPORTED>()
  const [loading, setLoading] = useState(false)
  const [drill, setDrill] = useState<Drill>()
  const [devices, setDevices] = useState<FleetDevices | 'ERROR' | typeof UNSUPPORTED>()
  const [search, setSearch] = useState(choices.search)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    graphQLFleetFields()
      .catch(() => new Set<string>())
      .then(served => mounted.current && setFields(served || new Set()))
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
    if (!fields) return
    setLoading(true)
    const next = await graphQLFleetVersions(query)
    if (!mounted.current) return
    setView(next)
    setLoading(false)
  }, [query, fields])

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
          value={choiceOf(choices.group)}
          sx={selectSx}
          InputLabelProps={{ shrink: true }}
          onChange={e => choose({ group: dimensionFor(e.target.value), then: undefined })}
          inputProps={{ 'data-choice': 'group' }}
        >
          {dimensions.map(d => (
            <MenuItem key={d.key} value={d.key}>
              {d.label}
            </MenuItem>
          ))}
        </TextField>
        {isFeature(choices.group) && (
          <FeaturePicker
            value={choices.group}
            name="group"
            onChange={group => choose({ group, then: choices.then === group ? undefined : choices.then })}
          />
        )}
        <TextField
          select
          size="small"
          label="Then by"
          value={choiceOf(choices.then)}
          sx={selectSx}
          InputLabelProps={{ shrink: true }}
          SelectProps={{ displayEmpty: true }}
          onChange={e => choose({ then: e.target.value ? dimensionFor(e.target.value, choices.group) : undefined })}
          inputProps={{ 'data-choice': 'then' }}
        >
          <MenuItem value="">None</MenuItem>
          {dimensions
            .filter(d => d.key !== choices.group)
            .map(d => (
              <MenuItem key={d.key} value={d.key}>
                {d.label}
              </MenuItem>
            ))}
        </TextField>
        {isFeature(choices.then) && (
          <FeaturePicker
            value={choices.then}
            name="then"
            exclude={choices.group}
            onChange={then => choose({ then })}
          />
        )}
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

  if (view === undefined || !fields) return <LoadingMessage message="Counting the fleet..." />

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
          dimensions={dimensions}
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
  dimensions: DimensionChoice[]
  onExpand: () => void
  onOpen: (drill: Drill) => void
  drill?: Drill
}> = ({ view, choices, dimensions, onExpand, onOpen, drill }) => {
  const columns = matrixColumns(view.columns, choices.older)
  const folded = columns.filter(c => c.kind === 'older').length
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
  const versionLabel = (column: MatrixColumn) => columnHeading(column).text
  const shade = (column: MatrixColumn) =>
    behindShade(column.kind === 'older' ? column.behind : column.kind === 'version' ? column.column.behind : null)
  const active = (row: FleetRow | null, column: MatrixColumn | null) =>
    !!drill && drill.row?.key === row?.key && drill.column?.key === column?.key

  const count = (row: FleetRow, column: MatrixColumn | null, isTotal = false) => {
    const value: FleetCount = column ? cellOf(row, column) : { version: '', devices: row.total, online: row.online }
    const target = isTotal ? null : row
    const title = `${rowName(row)}${column ? ` · ${versionLabel(column)}` : ''}`
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
                .map(key => dimensionLabel(key, dimensions))
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
                {columnHeading(column).majorMinor && (
                  <Tooltip title="A classic C device reports no full version: this is the major.minor its device type carries">
                    <Typography variant="caption" color="textSecondary" component="div" data-major-minor>
                      major.minor
                    </Typography>
                  </Tooltip>
                )}
                {column.kind === 'version' && column.column.label && (
                  <Chip
                    size="small"
                    color={/candidate/.test(column.column.label) ? 'primary' : undefined}
                    variant={/candidate/.test(column.column.label) ? 'filled' : 'outlined'}
                    label={userText(column.column.label)}
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
                title={rowName(row)}
              >
                {rowName(row)}
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
          <DrillTable devices={devices.devices} />
        </Box>
      </>
    )}
  </Box>
)

const drillCell = { paddingX: 1, whiteSpace: 'nowrap' } as const

// Where a device's daemon comes from (implementationSource): its own report, else its kind — every Control Link
// device without a report runs Go, every Classic one C.
const SOURCES: Record<string, string> = {
  report: 'reported by the device',
  controlLink: 'Control Link device, so Go',
  classic: 'Classic device, so C',
}

// The devices of a cell: what each runs and is — its daemon and version, Control Link or Classic, the package that
// shipped it and what upgrades it, what it supports — where the API says, else as before the taxonomy.
const DrillTable: React.FC<{ devices: FleetDevice[] }> = ({ devices }) => {
  const has = (field: keyof FleetDevice) => devices.some(device => device[field] != null)
  const taxonomy = has('implementation') || has('controlLink') || has('distribution')
  const titles = [
    'Device',
    'Version',
    'Status',
    ...(has('controlLink') ? ['Link'] : []),
    'Package',
    ...(has('updatedBy') ? ['Updated by'] : []),
    ...(has('features') ? ['Features'] : []),
    'OS',
    'Account',
    'Release',
  ]
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          {titles.map(title => (
            <TableCell key={title} sx={headSx}>
              {title}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {devices.map(device => {
          const version = shownVersion(device.version, device.implementation, device.connectdMajorMinor || undefined)
          const held = device.updateState === 'held'
          return (
            <TableRow key={device.id} data-device={device.id}>
              <TableCell sx={{ paddingX: 1 }}>
                <Link to={`/admin/devices/${device.id}`}>{device.name || device.id}</Link>
                <Typography variant="caption" color="textSecondary" component="div">
                  {device.id}
                </Typography>
              </TableCell>
              <TableCell sx={drillCell} data-drill-version>
                <Tooltip title={device.implementationSource ? SOURCES[device.implementationSource] || '' : ''}>
                  <span data-implementation-source={device.implementationSource || undefined}>{version.text}</span>
                </Tooltip>
                {version.majorMinor && (
                  <Typography variant="caption" color="textSecondary" component="div">
                    major.minor
                  </Typography>
                )}
              </TableCell>
              <TableCell sx={drillCell}>{userText(device.lastSeen)}</TableCell>
              {has('controlLink') && (
                <TableCell sx={drillCell} data-drill-link>
                  {device.controlLink == null ? '—' : device.controlLink ? CONTROL_LINK : CLASSIC}
                </TableCell>
              )}
              <TableCell sx={drillCell} data-drill-package>
                {taxonomy ? (
                  <>
                    {distributionName(device.distribution) || device.distribution || '—'}
                    {device.package && device.package !== device.version ? ` ${device.package}` : ''}
                    {device.format && (
                      <Typography variant="caption" color="textSecondary" component="div">
                        {formatName(device.format) || device.format}
                      </Typography>
                    )}
                  </>
                ) : (
                  <>
                    {userText(device.packageType)}
                    {device.package && device.package !== device.version ? ` ${device.package}` : ''}
                  </>
                )}
              </TableCell>
              {has('updatedBy') && (
                <TableCell sx={drillCell} data-drill-updated-by>
                  {updatedByName(device.updatedBy) || device.updatedBy || '—'}
                </TableCell>
              )}
              {has('features') && (
                <TableCell sx={{ paddingX: 1 }} data-drill-features>
                  {device.features?.length ? device.features.join(', ') : '—'}
                  {device.featuresSource === 'table' && (
                    <Typography variant="caption" color="textSecondary" component="div">
                      from its version
                    </Typography>
                  )}
                </TableCell>
              )}
              <TableCell sx={{ paddingX: 1 }}>{[device.os, device.arch].filter(Boolean).join(' · ') || '—'}</TableCell>
              <TableCell sx={{ paddingX: 1 }}>{device.account || device.accountId || '—'}</TableCell>
              <TableCell sx={{ paddingX: 1 }}>
                {userText(device.release)}
                <Typography variant="caption" color="textSecondary" component="div">
                  {managedText(device.managed)}
                </Typography>
                {held && (
                  <Typography variant="caption" color="warning.main" component="div" data-held>
                    blocked: {HELD}
                  </Typography>
                )}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
