import React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { Button } from '@mui/material'
import { useVirtualDevices } from '../hooks/useVirtualDevices'
import { suggestPlatform } from '../platforms/virtual'
import { openVirtualDeviceAdd } from './HostedDevices'
import { VirtualDevicePrefill } from './VirtualDeviceForm'
import type { DiscoveryMachine } from '../services/graphQLDiscovery'

/* The seam for discovery (the gateway's "What this device sees", grouped by machine): each machine's
   "Add as virtual device". Give it the gateway and the machine as discovery found it; it opens the add form with
   everything filled in and its services ticked. Renders nothing while the virtual-devices flag is off. */

export type DiscoveredOffer = {
  name: string // the instance's name, e.g. "DSM"
  application: number // the service type discovery suggests
  port: number
  protocol?: string
  type?: string // its DNS-SD type, e.g. "_smb._tcp"
  txt?: ILookup<string>
  host?: string // where it differs from the machine's host
}

export type DiscoveredMachine = {
  name?: string // a friendly name (a model, an instance's name)
  host: string // its mDNS host name (nas.local), else its address
  addresses?: string[]
  offers: DiscoveredOffer[]
}

// A machine as discovery groups it (services/graphQLDiscovery groupDiscovery), as the add form takes it: an offer's host
// only where it differs from the machine's, a printer's TXT (key=value) as a lookup.
export function discoveredMachine(machine: DiscoveryMachine): DiscoveredMachine {
  return {
    name: machine.name,
    host: machine.key,
    addresses: machine.addresses,
    offers: machine.offers.map(o => ({
      name: o.name,
      application: o.application,
      port: o.port,
      protocol: o.protocol,
      type: o.type,
      txt: o.txt
        ? Object.fromEntries(o.txt.map(entry => [entry.split('=')[0], entry.split('=').slice(1).join('=')]))
        : undefined,
      host: o.host && o.host !== machine.key ? o.host : undefined,
    })),
  }
}

// Whether a device may host the machines it sees (graphql's own test, services/virtual-devices hostingGateway): one
// running device sessions (its daemon reports it), that the viewer manages, and not itself virtual.
export function mayHostVirtualDevices(device: IDevice, sessionDevice: boolean): boolean {
  return sessionDevice && !device.virtual && device.permissions.includes('MANAGE')
}

export function machinePrefill(gatewayId: string, machine: DiscoveredMachine): VirtualDevicePrefill {
  return {
    gatewayId,
    name: machine.name || machine.host.replace(/\.local\.?$/, ''),
    host: machine.host,
    addresses: machine.addresses,
    platform: suggestPlatform(machine.offers, machine.host),
    services: machine.offers.map(o => ({
      name: o.name,
      application: o.application,
      port: o.port,
      protocol: o.protocol,
      host: o.host,
      checked: true,
    })),
  }
}

export const AddAsVirtualDevice: React.FC<{ gatewayId: string; machine: DiscoveredMachine }> = ({
  gatewayId,
  machine,
}) => {
  const { t } = useTranslation()
  const history = useHistory()
  if (!useVirtualDevices()) return null
  return (
    <Button
      size="small"
      onClick={event => {
        event.stopPropagation()
        openVirtualDeviceAdd(history, machinePrefill(gatewayId, machine))
      }}
    >
      {t('addAsVirtualDevice.button', 'Add as virtual device')}
    </Button>
  )
}
