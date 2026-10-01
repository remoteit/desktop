import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Background, Controls, Edge, MarkerType, Node, Position, ReactFlow, ReactFlowProvider } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Box, Typography, useTheme } from '@mui/material'
import { State } from '../store'
import { DeviceNetwork, NetworkMember, exposes, initiates } from '../services/graphQLDeviceNetworks'

type Props = {
  network: DeviceNetwork
  devices: IDevice[]
  exposure: (member: NetworkMember) => string
}

// Where each lane sits, and how far apart its nodes are.
const LANE = { people: 0, initiators: 260, hub: 540, targets: 820 }
const ROW = 76

/* A network drawn as it is (docs/superpowers/specs/2026-09-30-device-sessions-ui-design.md §3): on the left, who
   reaches it — its people (the owner, those it is shared with, and each organization role reaching it) and the devices
   that initiate; the network in the middle; on the right, its targets with what each exposes. A device that both
   initiates and is a target is one node on the right joined by one two-way line. Devices by tag are drawn like the
   rest. Lines leave the side of a box facing the network. Read-only: changes are made on the list. A device opens on a
   click. */
export const DeviceNetworkGraph: React.FC<Props> = props => (
  <ReactFlowProvider>
    <Graph {...props} />
  </ReactFlowProvider>
)

type Item = { id: string; label: React.ReactNode; sort?: string }

const Graph: React.FC<Props> = ({ network, devices, exposure }) => {
  const { t } = useTranslation()
  const history = useHistory()
  const theme = useTheme()
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

    const caption = (text: string) => (
      <Typography variant="caption" display="block" color="textSecondary">
        {text}
      </Typography>
    )
    const label = (name: string, detail?: string) => (
      <>
        {name}
        {detail && caption(detail)}
      </>
    )

    // Who reaches it: its owner and shares, then each organization role reaching it.
    const people: Item[] = [
      {
        id: `person:${network.owner.id}`,
        label: label(`👤 ${network.owner.email}`, t('deviceNetworkGraph.owner', 'Owner')),
      },
      ...network.access.map(share => ({
        id: `person:${share.user.id}`,
        label: label(`👤 ${share.organizationName || share.user.email}`, tierText(t, share.role)),
      })),
      ...(network.accountAccess || []).flatMap(section =>
        section.roles.map(role => ({
          id: `role:${section.accountId}/${role.roleId}/${role.tier}`,
          label: label(
            `👥 ${role.roleName} · ${role.members.length}`,
            `${section.accountName} · ${tierText(t, role.tier)}`
          ),
        }))
      ),
    ]

    // Devices, listed and by tag (a device listed on its own is what its listing says).
    const listedIds = new Set(network.devices.map(member => member.deviceId))
    const initiators: Item[] = []
    const targets: (Item & { both: boolean })[] = []
    for (const member of network.devices) {
      const target = exposes(network, member)
      const item = { id: `device:${member.deviceId}`, sort: nameOf(member.deviceId) }
      if (target)
        targets.push({ ...item, both: initiates(member), label: label(nameOf(member.deviceId), exposure(member)) })
      else if (initiates(member)) initiators.push({ ...item, label: label(nameOf(member.deviceId)) })
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
    for (const [id, how] of fromTags) {
      const item = { id: `device:${id}`, sort: nameOf(id) }
      const tagged = t('deviceNetworkGraph.byTag', 'by tag')
      if (how.all)
        targets.push({
          ...item,
          both: how.initiator,
          label: label(
            nameOf(id),
            [
              t('deviceNetworkGraph.allServices', 'All services'),
              how.anyPort && t('deviceNetworkGraph.anyPort', 'Any port'),
              tagged,
            ]
              .filter(Boolean)
              .join(' · ')
          ),
        })
      else if (how.initiator) initiators.push({ ...item, label: label(nameOf(id), tagged) })
    }
    const byName = (a: Item, b: Item) => (a.sort || '').localeCompare(b.sort || '')
    initiators.sort(byName)
    targets.sort((a, b) => Number(a.both) - Number(b.both) || byName(a, b))

    // The left lane holds people then initiators, in two columns; each column centred on the network.
    const tallest = Math.max(people.length, initiators.length, targets.length, 1)
    const middle = ((tallest - 1) * ROW) / 2
    const column = (count: number, index: number) => middle - ((count - 1) * ROW) / 2 + index * ROW
    const box = { fontSize: 12, width: 190, padding: 6 }
    const left = { sourcePosition: Position.Right, targetPosition: Position.Left }

    const nodes: Node[] = [
      {
        id: 'network',
        position: { x: LANE.hub, y: middle },
        data: { label: network.name },
        draggable: false,
        targetPosition: Position.Left,
        sourcePosition: Position.Right,
        style: { ...box, fontWeight: 600, borderWidth: 2, width: 150 },
      },
      ...people.map((item, index) => ({
        id: item.id,
        position: { x: LANE.people, y: column(people.length, index) },
        data: { label: item.label },
        type: 'input',
        ...left,
        style: box,
      })),
      ...initiators.map((item, index) => ({
        id: item.id,
        position: { x: LANE.initiators, y: column(initiators.length, index) },
        data: { label: item.label },
        type: 'input',
        ...left,
        style: box,
      })),
      ...targets.map((item, index) => ({
        id: item.id,
        position: { x: LANE.targets, y: column(targets.length, index) },
        data: { label: item.label },
        type: 'output',
        targetPosition: Position.Left,
        style: item.both ? { ...box, borderColor: theme.palette.primary.main } : box,
      })),
    ]

    const arrow = { type: MarkerType.ArrowClosed }
    const accent = theme.palette.primary.main
    const edges: Edge[] = [
      ...people.map(item => ({
        id: `${item.id}->network`,
        source: item.id,
        target: 'network',
        markerEnd: arrow,
        style: { strokeDasharray: '4 4' },
      })),
      ...initiators.map(item => ({ id: `${item.id}->network`, source: item.id, target: 'network', markerEnd: arrow })),
      // A device that both initiates and is a target: one two-way line, in the accent colour.
      ...targets.map(item => ({
        id: `network->${item.id}`,
        source: 'network',
        target: item.id,
        markerEnd: item.both ? { ...arrow, color: accent } : arrow,
        markerStart: item.both
          ? { type: MarkerType.ArrowClosed, color: accent, orient: 'auto-start-reverse' }
          : undefined,
        style: item.both ? { stroke: accent, strokeWidth: 2 } : undefined,
      })),
    ]
    return { nodes, edges }
  }, [network, devices, exposure, t, theme])

  const signature = JSON.stringify([nodes.map(node => node.id), dark])

  return (
    <Box sx={{ border: 1, borderColor: 'grayLighter.main', borderRadius: 1 }}>
      <Box sx={{ height: 520 }}>
        {/* Uncontrolled, and drawn anew when what it shows changes. */}
        <ReactFlow
          key={signature}
          defaultNodes={nodes}
          defaultEdges={edges}
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
      <Box sx={{ display: 'flex', gap: 3, paddingX: 2, paddingY: 1 }}>
        <Typography variant="caption" color="textSecondary">
          {t('deviceNetworkGraph.legendPeople', '- - - people')}
        </Typography>
        <Typography variant="caption" color="textSecondary">
          {t('deviceNetworkGraph.legendDevices', '—— devices')}
        </Typography>
        <Typography variant="caption" color="primary">
          {t('deviceNetworkGraph.legendBoth', '⟷ initiates and is a target')}
        </Typography>
      </Box>
    </Box>
  )
}

const tierText = (t: (key: string, fallback: string) => string, tier: string) =>
  tier === 'ADMIN'
    ? t('deviceNetworkGraph.admin', 'Admin')
    : tier === 'MANAGE'
    ? t('deviceNetworkGraph.manage', 'Can manage')
    : t('deviceNetworkGraph.connect', 'Can connect')
