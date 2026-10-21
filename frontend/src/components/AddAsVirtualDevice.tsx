import React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { Button } from '@mui/material'
import { useVirtualDevices } from '../hooks/useVirtualDevices'
import { suggestPlatform } from '../platforms/virtual'
import { openVirtualDeviceAdd } from './HostedDevices'
import { VirtualDevicePrefill } from './VirtualDeviceForm'

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
