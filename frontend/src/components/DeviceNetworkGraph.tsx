import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Background, Controls, Edge, MarkerType, Node, ReactFlow, ReactFlowProvider, useReactFlow } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Box, List, ListItem, ListItemText, ListSubheader, Typography } from '@mui/material'
import { State } from '../store'
import {
  DeviceNetwork,
  NetworkMember,
  graphQLAddNetworkDevice,
  graphQLRemoveNetworkDevice,
  exposes,
  initiates,
  targeted,
} from '../services/graphQLDeviceNetworks'

type Props = {
  network: DeviceNetwork
  devices: IDevice[]
  manage: boolean
  exposure: (member: NetworkMember) => string
  act: (change: () => Promise<unknown>) => Promise<void>
}

// Where each lane sits, and how far apart its nodes are.
const LANE = { people: 0, initiators: 240, hub: 500, targets: 760 }
const ROW = 90
const DRAG_TYPE = 'application/x-remoteit-device'

/* A network drawn (docs/superpowers/specs/2026-09-30-device-sessions-ui-design.md §3): the people who may connect and
   the devices that initiate on the left, the network in the middle, its targets — with what each exposes — on the
   right. A device opens on a click; one you drag in from the list joins as an initiator (dropped left of the network)
   or a target (right of it); a selected device leaves with Delete. */
export const DeviceNetworkGraph: React.FC<Props> = props => (
  <ReactFlowProvider>
    <Graph {...props} />
  </ReactFlowProvider>
)

const Graph: React.FC<Props> = ({ network, devices, manage, exposure, act }) => {
  const { t } = useTranslation()
  const history = useHistory()
  const dark = useSelector((state: State) => state.ui.themeDark)
  const { screenToFlowPosition } = useReactFlow()
  const [over, setOver] = useState(false)

  const nameOf = useCallback((id: string) => devices.find(device => device.id === id)?.name || id, [devices])
  const initiators = network.devices.filter(initiates)
  const targets = network.devices.filter(targeted)
  const people = [network.owner, ...network.access.map(a => a.user)]
  const addable = devices.filter(
    device => device.permissions.includes('MANAGE') && !network.devices.some(m => m.deviceId === device.id)
  )

  const { nodes, edges } = useMemo(() => {
    const tallest = Math.max(initiators.length + people.length, targets.length, 1)
    const middle = ((tallest - 1) * ROW) / 2
    const column = (count: number, index: number) => middle - ((count - 1) * ROW) / 2 + index * ROW

    const nodes: Node[] = [
      {
        id: 'network',
        position: { x: LANE.hub, y: middle },
        data: { label: network.name },
        draggable: false,
        deletable: false,
        style: { fontWeight: 600, borderWidth: 2 },
      },
      ...people.map((person, index) => ({
        id: `person:${person.id}`,
        position: { x: LANE.people, y: column(people.length + initiators.length, index) },
        data: { label: `👤 ${person.email}` },
        deletable: false,
      })),
      ...initiators.map((member, index) => ({
        id: `device:${member.deviceId}`,
        position: { x: LANE.initiators, y: column(people.length + initiators.length, people.length + index) },
        data: { label: nameOf(member.deviceId) },
        deletable: manage,
      })),
      ...targets
        .filter(member => member.role !== 'BOTH')
        .map((member, index) => ({
          id: `device:${member.deviceId}`,
          position: { x: LANE.targets, y: column(targets.length, index) },
          data: {
            label: (
              <>
                {nameOf(member.deviceId)}
                <Typography variant="caption" display="block" color="textSecondary">
                  {exposure(member)}
                </Typography>
              </>
            ),
          },
          deletable: manage,
        })),
    ]
    const arrow = { type: MarkerType.ArrowClosed }
    const edges: Edge[] = [
      ...people.map(person => ({
        id: `person:${person.id}->network`,
        source: `person:${person.id}`,
        target: 'network',
        markerEnd: arrow,
        style: { strokeDasharray: '4 4' },
        deletable: false,
      })),
      ...initiators.map(member => ({
        id: `${member.deviceId}->network`,
        source: `device:${member.deviceId}`,
        target: 'network',
        markerEnd: arrow,
        deletable: false,
      })),
      ...targets
        .filter(member => exposes(network, member))
        .map(member => ({
          id: `network->${member.deviceId}`,
          source: 'network',
          target: `device:${member.deviceId}`,
          markerEnd: arrow,
          label: member.role === 'BOTH' ? t('deviceNetworkGraph.both', 'also initiates') : undefined,
          deletable: false,
        })),
    ]
    return { nodes, edges }
  }, [network, people, initiators, targets, nameOf, exposure, manage, t])

  const signature = JSON.stringify([network.name, network.devices, people.map(person => person.id), devices.length])

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setOver(false)
    const deviceId = event.dataTransfer.getData(DRAG_TYPE)
    if (!deviceId || !manage) return
    const { x } = screenToFlowPosition({ x: event.clientX, y: event.clientY })
    const role = x < LANE.hub ? 'INITIATOR' : 'TARGET'
    act(() => graphQLAddNetworkDevice(network.id, deviceId, { role, scope: 'ALL', anyPort: false }))
  }

  return (
    <Box sx={{ display: 'flex', height: 480, gap: 1 }}>
      <Box
        sx={{ flexGrow: 1, border: 1, borderColor: over ? 'primary.main' : 'grayLighter.main', borderRadius: 1 }}
        onDragOver={event => {
          if (!manage) return
          event.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
      >
        {/* Uncontrolled — React Flow keeps selection and positions — and drawn anew when the network changes. */}
        <ReactFlow
          key={signature}
          defaultNodes={nodes}
          defaultEdges={edges}
          fitView
          colorMode={dark ? 'dark' : 'light'}
          nodesConnectable={false}
          deleteKeyCode={manage ? ['Backspace', 'Delete'] : null}
          onNodeClick={(_, node) => node.id.startsWith('device:') && history.push(`/devices/${node.id.slice(7)}`)}
          onNodesDelete={deleted =>
            deleted
              .filter(node => node.id.startsWith('device:'))
              .forEach(node => {
                const deviceId = node.id.slice(7)
                if (
                  window.confirm(
                    t('deviceNetworkGraph.confirmRemove', 'Remove {{name}} from the network?', {
                      name: nameOf(deviceId),
                    })
                  )
                )
                  act(() => graphQLRemoveNetworkDevice(network.id, deviceId))
              })
          }
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <Controls showInteractive={false} />
        </ReactFlow>
      </Box>
      {manage && network.kind !== 'LINK' && (
        <List dense sx={{ width: 200, overflowY: 'auto' }}>
          <ListSubheader>{t('deviceNetworkGraph.drag', 'Drag in to add')}</ListSubheader>
          {addable.map(device => (
            <ListItem
              key={device.id}
              draggable
              onDragStart={event => event.dataTransfer.setData(DRAG_TYPE, device.id)}
              sx={{ cursor: 'grab' }}
            >
              <ListItemText primary={device.name} />
            </ListItem>
          ))}
          {!addable.length && (
            <ListItem>
              <ListItemText secondary={t('deviceNetworkGraph.noneToAdd', 'No other device you manage')} />
            </ListItem>
          )}
        </List>
      )}
    </Box>
  )
}
