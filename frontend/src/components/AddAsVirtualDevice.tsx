import React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { Button } from '@mui/material'
import { useVirtualDevices } from '../hooks/useVirtualDevices'
import { suggestPlatform } from '../platforms/virtual'
import { openVirtualDeviceAdd } from './HostedDevices'
import { VirtualDevicePrefill } from './VirtualDeviceForm'
import { DiscoveryMachine, DiscoveryRank, offerRank, offerServiceName } from '../services/graphQLDiscovery'

/* The seam for discovery (the gateway's "What this device sees", grouped by machine): each machine's
   "Add as virtual device". Give it the gateway and the machine as discovery found it; it opens the add form with
   everything filled in and its services ticked. Renders nothing while the virtual-devices flag is off. */

export type DiscoveredOffer = {
  name: string // the instance's name, e.g. "DSM"
  label?: string // what it is: "Printer", "Web admin"
  application: number // the service type discovery suggests
  port: number
  protocol?: string
  type?: string // its DNS-SD type, e.g. "_smb._tcp"
  txt?: ILookup<string>
  host?: string // where it differs from the machine's host
  rank?: DiscoveryRank // how likely it is wanted: likely ones are ticked
}

export type DiscoveredMachine = {
  name?: string // a friendly name (its instances' shared name, a model)
  host: string // its mDNS host name (nas.local), else its address
  addresses?: string[]
  offers: DiscoveredOffer[]
}

// A machine as discovery groups it (services/graphQLDiscovery groupDiscovery), as the add form takes it: its name as the
// page shows it, an offer's host only where it differs from the machine's, a printer's TXT (key=value) as a lookup.
export function discoveredMachine(machine: DiscoveryMachine): DiscoveredMachine {
  return {
    name: machine.name,
    host: machine.key,
    addresses: machine.addresses,
    offers: machine.offers.map(o => ({
      name: o.name,
      label: o.label,
      application: o.application,
      port: o.port,
      protocol: o.protocol,
      type: o.type,
      txt: o.txt
        ? Object.fromEntries(o.txt.map(entry => [entry.split('=')[0], entry.split('=').slice(1).join('=')]))
        : undefined,
      host: o.host && o.host !== machine.key ? o.host : undefined,
      rank: offerRank(o),
    })),
  }
}

// Whether a device may host the machines it sees (graphql's own test, services/virtual-devices hostingGateway): one
// running device sessions (its daemon reports it), that the viewer manages, and not itself virtual.
export function mayHostVirtualDevices(device: IDevice, sessionDevice: boolean): boolean {
  return sessionDevice && !device.virtual && device.permissions.includes('MANAGE')
}

// Its services, named as discovery names them (offerServiceName), the likely ones first and ticked (where none is likely,
// the others; never one not reachable remotely).
export function machinePrefill(gatewayId: string, machine: DiscoveredMachine): VirtualDevicePrefill {
  const rank = (o: DiscoveredOffer) => o.rank || 'likely'
  const ticked = machine.offers.some(o => rank(o) === 'likely') ? 'likely' : 'other'
  const order: DiscoveryRank[] = ['likely', 'other', 'hidden']
  const offers = [...machine.offers].sort((a, b) => order.indexOf(rank(a)) - order.indexOf(rank(b)))
  const name = machine.name || machine.host.replace(/\.local\.?$/, '')
  return {
    gatewayId,
    name,
    host: machine.host,
    addresses: machine.addresses,
    platform: suggestPlatform(machine.offers, machine.host),
    services: offers.map(o => ({
      name: offerServiceName({ ...o, kind: 'network' }, name, { onVirtualDevice: true }),
      application: o.application,
      port: o.port,
      protocol: o.protocol,
      host: o.host,
      checked: rank(o) === ticked,
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
      // Outlined in the primary colour: a machine's own action, beside its offers' filled "Add as service" ones.
      color="primary"
      variant="outlined"
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
