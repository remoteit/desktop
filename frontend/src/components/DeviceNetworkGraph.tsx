import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  Background,
  BaseEdge,
  Controls,
  Edge,
  EdgeProps,
  InternalNode,
  MarkerType,
  Node,
  Position,
  ReactFlow,
  ReactFlowProvider,
  getBezierPath,
  useInternalNode,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Box, Typography } from '@mui/material'
import { State } from '../store'
import { DeviceNetwork, NetworkMember, exposes, initiates } from '../services/graphQLDeviceNetworks'

type Props = {
  network: DeviceNetwork
  devices: IDevice[]
  exposure: (member: NetworkMember) => string
}

// Where each lane sits, and how far apart its nodes are.
const LANE = { userMode: 0, initiators: 260, hub: 540, targets: 820 }
const ROW = 76

// One colour per kind of line: a device initiating, a target, a device that is both. They read in light and dark.
const COLOR = { initiator: '#1D9E75', target: '#378ADD', both: '#7F77DD' }

/* A network drawn as it is (docs/superpowers/specs/2026-09-30-device-sessions-ui-design.md §3): its devices only. On
   the left, what reaches it — the devices that initiate, and its people's devices in user mode (a person reaches it
   through those); the network in the middle; on the right, its targets with what each exposes. A device that both
   initiates and is a target is one node on the right joined by one two-way line. Devices by tag are drawn like the
   rest. A line meets each box at the point on its edge nearest the other end, so it slides as boxes move. Read-only:
   changes are made on the list. A device opens on a click. */
export const DeviceNetworkGraph: React.FC<Props> = props => (
  <ReactFlowProvider>
    <Graph {...props} />
  </ReactFlowProvider>
)

type Item = { id: string; label: React.ReactNode; sort: string }

const Graph: React.FC<Props> = ({ network, devices, exposure }) => {
  const { t } = useTranslation()
  const history = useHistory()
  const dark = useSelector((state: State) => state.ui.themeDark)

  const { nodes, edges } = useMemo(() => {
    const named = new Map<string, string>()
    for (const rule of network.deviceRules || [])
      for (const device of rule.named || []) named.set(device.id, device.name)
    const nameOf = (id: string) =>
      devices.find(device => device.id === id)?.name ||
      network.devices.find(member => member.deviceId === id)?.name ||
      named.get(id) ||
      id
    const label = (name: string, detail?: string) => (
      <>
        {name}
        {detail && (
          <Typography variant="caption" display="block" color="textSecondary">
            {detail}
          </Typography>
        )}
      </>
    )

    // Devices, listed and by tag (a device listed on its own is what its listing says).
    const listedIds = new Set(network.devices.map(member => member.deviceId))
    const initiators: Item[] = []
    const targets: (Item & { both: boolean })[] = []
    for (const member of network.devices) {
      const item = { id: `device:${member.deviceId}`, sort: nameOf(member.deviceId) }
      if (exposes(network, member))
        targets.push({ ...item, both: initiates(member), label: label(item.sort, exposure(member)) })
      else if (initiates(member)) initiators.push({ ...item, label: label(item.sort) })
    }
    const fromTags = new Map<string, { initiator: boolean; all: boolean; anyPort: boolean }>()
    for (const rule of network.deviceRules || []) {
      for (const id of rule.devices) {
        if (listedIds.has(id)) continue
        const was = fromTags.get(id) || { initiator: false, all: false, anyPort: false }
        fromTags.set(id, {
          initiator: was.initiator || rule.initiator,
          all: was.all || rule.allServices || rule.anyPort,
          anyPort: was.anyPort || rule.anyPort,
        })
      }
    }
    const tagged = t('deviceNetworkGraph.byTag', 'by tag')
    for (const [id, how] of fromTags) {
      const item = { id: `device:${id}`, sort: nameOf(id) }
      if (how.all) {
        const detail = [
          t('deviceNetworkGraph.allServices', 'All services'),
          how.anyPort && t('deviceNetworkGraph.anyPort', 'Any port'),
          tagged,
        ]
        targets.push({ ...item, both: how.initiator, label: label(item.sort, detail.filter(Boolean).join(' · ')) })
      } else if (how.initiator) initiators.push({ ...item, label: label(item.sort, tagged) })
    }

    // Its people's devices in user mode — each reaches it as its person — unless already drawn as a device on it.
    const emails = new Map<string, string>([
      [network.owner.id, network.owner.email],
      ...network.access.map(share => [share.user.id, share.user.email] as [string, string]),
      ...(network.accountAccess || []).flatMap(section =>
        section.roles.flatMap(role => role.members.map(member => [member.id, member.email] as [string, string]))
      ),
    ])
    const drawn = new Set([...initiators, ...targets].map(item => item.id))
    const userMode: Item[] = (network.userModeDevices || [])
      .filter(device => !drawn.has(`device:${device.deviceId}`))
      .filter((device, index, all) => all.findIndex(other => other.deviceId === device.deviceId) === index)
      .map(device => ({
        id: `device:${device.deviceId}`,
        sort: device.name,
        label: label(
          device.name,
          t('deviceNetworkGraph.userMode', 'User mode · {{email}}', { email: emails.get(device.userId) || '' })
        ),
      }))

    const byName = (a: Item, b: Item) => a.sort.localeCompare(b.sort)
    userMode.sort(byName)
    initiators.sort(byName)
    targets.sort((a, b) => Number(a.both) - Number(b.both) || byName(a, b))

    // Each column centred on the network.
    const tallest = Math.max(userMode.length, initiators.length, targets.length, 1)
    const middle = ((tallest - 1) * ROW) / 2
    const column = (count: number, index: number) => middle - ((count - 1) * ROW) / 2 + index * ROW
    const box = { fontSize: 12, width: 190, padding: 6 }
    const node = (item: Item, x: number, y: number, style: React.CSSProperties = box): Node => ({
      id: item.id,
      position: { x, y },
      data: { label: item.label },
      style,
    })

    const nodes: Node[] = [
      {
        id: 'network',
        position: { x: LANE.hub, y: middle },
        data: { label: network.name },
        draggable: false,
        style: { ...box, fontWeight: 600, borderWidth: 2, width: 150 },
      },
      ...userMode.map((item, index) => node(item, LANE.userMode, column(userMode.length, index))),
      ...initiators.map((item, index) => node(item, LANE.initiators, column(initiators.length, index))),
      ...targets.map((item, index) =>
        node(item, LANE.targets, column(targets.length, index), item.both ? { ...box, borderColor: COLOR.both } : box)
      ),
    ]

    const marker = (color: string) => ({ type: MarkerType.ArrowClosed, color })
    const line = (color: string, dashed?: boolean) => ({
      stroke: color,
      strokeWidth: 1.5,
      ...(dashed && { strokeDasharray: '5 4' }),
    })
    const edges: Edge[] = [
      ...userMode.map(item => ({
        id: `${item.id}->network`,
        source: item.id,
        target: 'network',
        type: 'floating',
        markerEnd: marker(COLOR.initiator),
        style: line(COLOR.initiator, true),
      })),
      ...initiators.map(item => ({
        id: `${item.id}->network`,
        source: item.id,
        target: 'network',
        type: 'floating',
        markerEnd: marker(COLOR.initiator),
        style: line(COLOR.initiator),
      })),
      // A device that both initiates and is a target: one two-way line.
      ...targets.map(item => ({
        id: `network->${item.id}`,
        source: 'network',
        target: item.id,
        type: 'floating',
        markerEnd: marker(item.both ? COLOR.both : COLOR.target),
        markerStart: item.both ? { ...marker(COLOR.both), orient: 'auto-start-reverse' } : undefined,
        style: line(item.both ? COLOR.both : COLOR.target),
      })),
    ]
    return { nodes, edges }
  }, [network, devices, exposure, t])

  const signature = JSON.stringify([nodes.map(node => node.id), dark])

  return (
    <Box sx={{ border: 1, borderColor: 'grayLighter.main', borderRadius: 1 }}>
      {/* Lines meet the boxes anywhere on their edges, so the fixed connection points are not shown. */}
      <Box sx={{ height: 520, '& .react-flow__handle': { opacity: 0 } }}>
        {/* Uncontrolled, and drawn anew when what it shows changes. */}
        <ReactFlow
          key={signature}
          defaultNodes={nodes}
          defaultEdges={edges}
          edgeTypes={EDGE_TYPES}
          fitView
          colorMode={dark ? 'dark' : 'light'}
          nodesConnectable={false}
          deleteKeyCode={null}
          onNodeClick={(_, node) => node.id.startsWith('device:') && history.push(`/devices/${node.id.slice(7)}`)}
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <Controls showInteractive={false} />
        </ReactFlow>
      </Box>
      <Box sx={{ display: 'flex', gap: 3, paddingX: 2, paddingY: 1, flexWrap: 'wrap' }}>
        <Legend color={COLOR.initiator} text={t('deviceNetworkGraph.legendInitiator', 'Initiator')} />
        <Legend color={COLOR.initiator} dashed text={t('deviceNetworkGraph.legendUserMode', 'Device in user mode')} />
        <Legend color={COLOR.target} text={t('deviceNetworkGraph.legendTarget', 'Target')} />
        <Legend color={COLOR.both} text={t('deviceNetworkGraph.legendBoth', 'Both')} />
      </Box>
    </Box>
  )
}

const Legend: React.FC<{ color: string; dashed?: boolean; text: string }> = ({ color, dashed, text }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
    <Box sx={{ width: 22, borderTop: `2px ${dashed ? 'dashed' : 'solid'} ${color}` }} />
    <Typography variant="caption" color="textSecondary">
      {text}
    </Typography>
  </Box>
)

// The point where the line from one box's centre to another's crosses the first box's edge.
function edgePoint(node: InternalNode, other: InternalNode) {
  const w = (node.measured.width ?? 0) / 2
  const h = (node.measured.height ?? 0) / 2
  const x2 = node.internals.positionAbsolute.x + w
  const y2 = node.internals.positionAbsolute.y + h
  const x1 = other.internals.positionAbsolute.x + (other.measured.width ?? 0) / 2
  const y1 = other.internals.positionAbsolute.y + (other.measured.height ?? 0) / 2
  const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h)
  const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h)
  const a = 1 / (Math.abs(xx1) + Math.abs(yy1) || 1)
  const xx3 = a * xx1
  const yy3 = a * yy1
  return { x: w * (xx3 + yy3) + x2, y: h * (-xx3 + yy3) + y2 }
}

// Which side of a box a point on its edge lies on, so the curve leaves square to it.
function sideOf(node: InternalNode, point: { x: number; y: number }): Position {
  const { x, y } = node.internals.positionAbsolute
  const width = node.measured.width ?? 0
  const height = node.measured.height ?? 0
  if (point.x <= x + 1) return Position.Left
  if (point.x >= x + width - 1) return Position.Right
  if (point.y <= y + 1) return Position.Top
  if (point.y >= y + height - 1) return Position.Bottom
  return Position.Top
}

// A line that meets each box where it is nearest the other, rather than at a fixed handle.
const FloatingEdge: React.FC<EdgeProps> = ({ id, source, target, markerEnd, markerStart, style }) => {
  const from = useInternalNode(source)
  const to = useInternalNode(target)
  if (!from || !to) return null
  const start = edgePoint(from, to)
  const end = edgePoint(to, from)
  const [path] = getBezierPath({
    sourceX: start.x,
    sourceY: start.y,
    sourcePosition: sideOf(from, start),
    targetX: end.x,
    targetY: end.y,
    targetPosition: sideOf(to, end),
  })
  return <BaseEdge id={id} path={path} markerEnd={markerEnd} markerStart={markerStart} style={style} />
}

const EDGE_TYPES = { floating: FloatingEdge }
