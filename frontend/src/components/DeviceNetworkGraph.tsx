import React, { useEffect, useMemo, useRef, useState } from 'react'
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
}

const BOX = 172 // a device's box width
const HUB = 172 // the network's box width
const GAP = 16 // between boxes in a row
const ROW = 56 // from one row of boxes to the next
const HEADING = 26 // a band's heading, above its first row
const BAND = 64 // between bands, room for the lines to curve

// One colour per kind of line: can reach, can be reached, both. They read in light and dark.
const COLOR = { reach: '#1D9E75', reached: '#378ADD', both: '#7F77DD' }

/* A network drawn as it is, in bands as wide as the panel: at the top what can reach — devices, and people's devices
   with full access as them (dashed) — then the network beside the devices that both reach and can be reached (one
   two-way line each), and at the bottom what can be reached and how. A line meets each box at the point on its edge nearest the other end, so it slides as
   boxes move. Read-only; a device opens on a click. */
export const DeviceNetworkGraph: React.FC<Props> = props => (
  <ReactFlowProvider>
    <Graph {...props} />
  </ReactFlowProvider>
)

type Item = { id: string; label: React.ReactNode; sort: string; dashed?: boolean }

const Graph: React.FC<Props> = ({ network, devices }) => {
  const { t } = useTranslation()
  const history = useHistory()
  const dark = useSelector((state: State) => state.ui.themeDark)
  const frame = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    if (!frame.current) return
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)))
    observer.observe(frame.current)
    return () => observer.disconnect()
  }, [])
  const across = Math.max(2, Math.min(5, Math.floor((width - 24 + GAP) / (BOX + GAP)) || 3))

  const { nodes, edges, size } = useMemo(() => {
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
        <Box component="span" sx={{ fontWeight: 500, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {name}
        </Box>
        {detail && (
          <Typography variant="caption" display="block" color="textSecondary" sx={{ fontSize: 10, lineHeight: 1.3 }}>
            {detail}
          </Typography>
        )}
      </>
    )
    const servicesOf = (id: string) =>
      devices.find(device => device.id === id)?.services?.length ??
      network.devices.find(member => member.deviceId === id)?.services?.length ??
      0
    const how = (member: NetworkMember) => {
      if (member.anyPort) return t('deviceNetworkGraph.allAnyPort', 'All services and any port')
      if (member.scope === 'ALL') return t('deviceNetworkGraph.allServices', 'All services')
      const count = network.connections.filter(c => c.service.device?.id === member.deviceId).length
      return t('deviceNetworkGraph.chosen', '{{count}} of {{total}} services', {
        count,
        total: Math.max(count, servicesOf(member.deviceId)),
      })
    }

    const listedIds = new Set(network.devices.map(member => member.deviceId))
    const reachers: Item[] = []
    const targets: (Item & { both: boolean })[] = []
    for (const member of network.devices) {
      const item = { id: `device:${member.deviceId}`, sort: nameOf(member.deviceId) }
      if (exposes(network, member))
        targets.push({ ...item, both: initiates(member), label: label(item.sort, how(member)) })
      else if (initiates(member)) reachers.push({ ...item, label: label(item.sort) })
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
    for (const [id, rule] of fromTags) {
      const item = { id: `device:${id}`, sort: nameOf(id) }
      if (rule.all) {
        const detail = rule.anyPort
          ? t('deviceNetworkGraph.allAnyPort', 'All services and any port')
          : t('deviceNetworkGraph.allServices', 'All services')
        targets.push({ ...item, both: rule.initiator, label: label(item.sort, `${detail} · ${tagged}`) })
      } else if (rule.initiator) reachers.push({ ...item, label: label(item.sort, tagged) })
    }

    // Its people's devices with full access as them, unless already drawn as a device on it.
    const emails = new Map<string, string>([
      [network.owner.id, network.owner.email],
      ...network.access.map(share => [share.user.id, share.user.email] as [string, string]),
      ...(network.accountAccess || []).flatMap(section =>
        section.roles.flatMap(role => role.members.map(member => [member.id, member.email] as [string, string]))
      ),
    ])
    const drawn = new Set([...reachers, ...targets].map(item => item.id))
    const people: Item[] = (network.userModeDevices || [])
      .filter(device => !drawn.has(`device:${device.deviceId}`))
      .filter((device, index, all) => all.findIndex(other => other.deviceId === device.deviceId) === index)
      .map(device => ({
        id: `device:${device.deviceId}`,
        sort: device.name,
        dashed: true,
        label: label(
          device.name,
          t('deviceNetworkGraph.fullAccess', 'Full access as {{email}}', { email: emails.get(device.userId) || '' })
        ),
      }))

    const byName = (a: Item, b: Item) => a.sort.localeCompare(b.sort)
    reachers.sort(byName)
    people.sort(byName)
    const left = [...reachers, ...people]
    const right = targets.filter(item => !item.both).sort(byName)
    const both = targets.filter(item => item.both).sort(byName)

    const box: React.CSSProperties = {
      fontSize: 12,
      width: BOX,
      padding: '6px 8px',
      borderRadius: 6,
      textAlign: 'left',
    }
    const node = (item: Item, x: number, y: number, style: React.CSSProperties = box): Node => ({
      id: item.id,
      position: { x, y },
      data: { label: item.label },
      style: item.dashed ? { ...style, borderStyle: 'dashed' } : style,
    })
    const heading = (id: string, text: string, x: number, y: number): Node => ({
      id,
      position: { x, y },
      data: { label: text },
      draggable: false,
      selectable: false,
      connectable: false,
      style: {
        width: Math.max(BOX, 260),
        border: 'none',
        background: 'transparent',
        boxShadow: 'none',
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
        opacity: 0.6,
        padding: 0,
        textAlign: 'left',
      },
    })
    const rowWidth = (count: number) => count * BOX + (count - 1) * GAP
    const full = rowWidth(Math.max(1, Math.min(across, Math.max(left.length, right.length, both.length + 1))))
    const nodes: Node[] = []
    let y = 0
    const band = (key: string, title: string, items: Item[], color: string) => {
      if (!items.length) return
      nodes.push(heading(`heading:${key}`, title, -full / 2, y))
      y += HEADING
      items.forEach((item, index) => {
        const row = Math.floor(index / across)
        const inRow = Math.min(across, items.length - row * across)
        const x = -rowWidth(inRow) / 2 + (index % across) * (BOX + GAP)
        nodes.push(node(item, x, y + row * ROW, { ...box, borderColor: color }))
      })
      y += Math.ceil(items.length / across) * ROW - (ROW - 40) + BAND
    }
    band('reach', t('deviceNetworkGraph.reachHeading', 'Can reach'), left, COLOR.reach)
    if (both.length) {
      nodes.push(heading('heading:both', t('deviceNetworkGraph.bothHeading', 'Can reach and be reached'), -full / 2, y))
      y += HEADING
    }
    const beside = both.slice(0, across - 1)
    const hubRow = [...beside.filter((_, i) => i % 2 === 1).reverse(), null, ...beside.filter((_, i) => i % 2 === 0)]
    hubRow.forEach((item, index) => {
      const x = -rowWidth(hubRow.length) / 2 + index * (BOX + GAP)
      if (item) nodes.push(node(item, x, y, { ...box, borderColor: COLOR.both }))
      else
        nodes.push({
          id: 'network',
          position: { x: x + (BOX - HUB) / 2, y: y - 2 },
          data: { label: network.name },
          style: { ...box, fontWeight: 600, borderWidth: 2, width: HUB, textAlign: 'center', padding: '10px 8px' },
        })
    })
    y += ROW
    const rest = both.slice(beside.length)
    rest.forEach((item, index) => {
      const row = Math.floor(index / across)
      const inRow = Math.min(across, rest.length - row * across)
      const x = -rowWidth(inRow) / 2 + (index % across) * (BOX + GAP)
      nodes.push(node(item, x, y + row * ROW, { ...box, borderColor: COLOR.both }))
    })
    y += Math.ceil(rest.length / across) * ROW - (ROW - 40) + BAND
    band('reached', t('deviceNetworkGraph.reachedHeading', 'Can be reached'), right, COLOR.reached)

    const marker = (color: string) => ({ type: MarkerType.ArrowClosed, color })
    const line = (color: string, dashed?: boolean) => ({
      stroke: color,
      strokeWidth: 1.5,
      ...(dashed && { strokeDasharray: '5 4' }),
    })
    const edges: Edge[] = [
      ...left.map(item => ({
        id: `${item.id}->network`,
        source: item.id,
        target: 'network',
        type: 'floating',
        markerEnd: marker(COLOR.reach),
        style: line(COLOR.reach, item.dashed),
      })),
      ...[...right, ...both].map(item => ({
        id: `network->${item.id}`,
        source: 'network',
        target: item.id,
        type: 'floating',
        markerEnd: marker(item.both ? COLOR.both : COLOR.reached),
        markerStart: item.both ? { ...marker(COLOR.both), orient: 'auto-start-reverse' } : undefined,
        style: line(item.both ? COLOR.both : COLOR.reached),
      })),
    ]
    return { nodes, edges, size: { width: full, height: y - BAND } }
  }, [network, devices, t, across])

  const signature = JSON.stringify([nodes.map(node => node.id), dark, across])
  // Tall enough to draw it at the scale the panel's width allows, so a small network is not drawn tiny in a tall box.
  const PAD = 32
  const scale = width ? Math.min(1, (width - PAD) / size.width) : 1
  const height = Math.min(760, Math.max(240, Math.round(size.height * scale + PAD * 2 + 48)))

  return (
    <Box sx={{ border: 1, borderColor: 'grayLighter.main', borderRadius: 1, overflow: 'hidden' }}>
      {/* Lines meet the boxes anywhere on their edges, so the fixed connection points are not shown. */}
      <Box ref={frame} sx={{ height, '& .react-flow__handle': { opacity: 0 } }}>
        <ReactFlow
          key={`${signature}:${height}`}
          defaultNodes={nodes}
          defaultEdges={edges}
          edgeTypes={EDGE_TYPES}
          fitView
          fitViewOptions={FIT_VIEW}
          minZoom={0.2}
          colorMode={dark ? 'dark' : 'light'}
          nodesConnectable={false}
          deleteKeyCode={null}
          onNodeClick={(_, node) => node.id.startsWith('device:') && history.push(`/devices/${node.id.slice(7)}`)}
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <Controls showInteractive={false} orientation="horizontal" />
        </ReactFlow>
      </Box>
      <Box
        sx={{
          display: 'flex',
          gap: 2.5,
          rowGap: 0.75,
          paddingX: 2,
          paddingY: 1.25,
          flexWrap: 'wrap',
          borderTop: 1,
          borderColor: 'grayLighter.main',
        }}
      >
        <Legend color={COLOR.reach} text={t('deviceNetworkGraph.legendReach', 'Can reach')} />
        <Legend color={COLOR.reach} dashed text={t('deviceNetworkGraph.legendFullAccess', 'Full access as a person')} />
        <Legend color={COLOR.reached} text={t('deviceNetworkGraph.legendReached', 'Can be reached')} />
        <Legend color={COLOR.both} text={t('deviceNetworkGraph.legendBoth', 'Can reach and be reached')} />
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
const FIT_VIEW = { padding: 0.08, maxZoom: 1 }
