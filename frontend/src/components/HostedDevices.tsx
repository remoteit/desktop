import React from 'react'
import { useTranslation } from 'react-i18next'
import { List, ListItemText, Typography } from '@mui/material'
import { ListItemLocation } from './ListItemLocation'
import { TargetPlatform } from './TargetPlatform'
import { StatusChip } from './StatusChip'
import { IconButton } from '../buttons/IconButton'
import { useHistory } from 'react-router-dom'
import { Title } from './Title'
import { spacing } from '../styling'
import type { VirtualDevicePrefill } from './VirtualDeviceForm'

/* A gateway's virtual devices, after its services: each one the viewer can see (graphql leaves out the rest, so
   someone who sees the gateway and not a hosted device does not learn it exists), with its state and service count,
   each linking to its own page. Someone who manages the gateway can add one here. */

export const virtualDeviceAddPath = (gatewayId?: string) => `/add/virtual${gatewayId ? `/${gatewayId}` : ''}`

/* What the add form opens with, handed over at the navigation: the app's hash routing carries no route state, so the
   page takes it once, on mount (a reload opens it empty). */
let handedOver: VirtualDevicePrefill | undefined

export function openVirtualDeviceAdd(history: { push: (path: string) => void }, prefill: VirtualDevicePrefill = {}) {
  handedOver = prefill
  history.push(virtualDeviceAddPath(prefill.gatewayId))
}

// Cleared a moment later, not at once: a development render reads its initial state twice.
export function takeVirtualDevicePrefill(): VirtualDevicePrefill | undefined {
  const prefill = handedOver
  setTimeout(() => handedOver === prefill && (handedOver = undefined))
  return prefill
}

type Props = { device: IDevice }

export const HostedDevices: React.FC<Props> = ({ device }) => {
  const { t } = useTranslation()
  const history = useHistory()
  const hosted = device.hostedDevices || []
  const manage = device.permissions.includes('MANAGE')

  if (device.virtual || !hosted.length) return null

  return (
    <>
      <Typography variant="subtitle1">
        <Title>{t('hostedDevices.virtualDevices', 'Virtual devices')}</Title>
        {manage && (
          <IconButton
            icon="plus"
            size="md"
            title={t('hostedDevices.add', 'Add virtual device')}
            onClick={() => history.push(virtualDeviceAddPath(device.id))}
          />
        )}
      </Typography>
      <List sx={{ '& .MuiListItem-root': { paddingRight: spacing.sm } }}>
        {hosted.map(h => (
          <ListItemLocation
            key={h.id}
            to={`/devices/${h.id}`}
            icon={<TargetPlatform id={h.targetPlatform} size="lg" />}
            inset={1.5}
            dense
          >
            <ListItemText
              primary={h.name}
              secondary={[
                h.host,
                t('hostedDevices.services', {
                  count: h.serviceCount,
                  defaultValue_one: '{{count}} service',
                  defaultValue_other: '{{count}} services',
                }),
              ]
                .filter(Boolean)
                .join(' · ')}
            />
            <StatusChip device={{ state: h.state, services: [] } as unknown as IDevice} />
          </ListItemLocation>
        ))}
      </List>
    </>
  )
}

export const AddVirtualDeviceRow: React.FC<{ device: IDevice }> = ({ device }) => {
  const { t } = useTranslation()
  if (device.virtual || !device.permissions.includes('MANAGE')) return null
  return (
    <ListItemLocation to={virtualDeviceAddPath(device.id)} icon="plus" dense>
      <ListItemText
        primary={t('hostedDevices.addVirtual', 'Add virtual device')}
        secondary={t(
          'hostedDevices.gatewayHint',
          'Add a printer, NAS or PLC on this network as its own device. This device is its gateway.'
        )}
      />
    </ListItemLocation>
  )
}
