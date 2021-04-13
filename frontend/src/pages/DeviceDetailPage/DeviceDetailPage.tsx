import React, { useEffect } from 'react'
import { TargetPlatform } from '../../components/TargetPlatform'
import { Gutters } from '../../components/Gutters'
import { DataDisplay } from '../../components/DataDisplay'
import { QualityDetails } from '../../components/QualityDetails'
import { DeviceHeaderMenu } from '../../components/DeviceHeaderMenu'
import analyticsHelper from '../../helpers/analyticsHelper'

const ATTRIBUTES = [
  'categoryA',
  'categoryB',
  'categoryC',
  'categoryD',
  'categoryE',
  'statusA',
  'statusB',
  'statusC',
  'statusD',
  'statusE',
]

export const DeviceDetailPage: React.FC<{ device?: IDevice }> = ({ device }) => {
  useEffect(() => {
    analyticsHelper.page('DevicesDetailPage')
  }, [])

  if (!device) return null

  return (
    <DeviceHeaderMenu device={device}>
      <Gutters>
        {/* {!editable && <AdminPanelConnect device={device} connections={connections} />} */}
        <DataDisplay
          data={[
            { label: 'Device Name', value: device.name },
            { label: 'Platform', value: TargetPlatform({ id: device.targetPlatform, label: true }), format: 'element' },
            { label: 'Connectivity', format: 'element', value: <QualityDetails device={device} /> },
            { label: 'Owner', value: device.owner.email },
            { label: 'Last reported', value: { start: device.lastReported, ago: true }, format: 'duration' },
            { label: 'ISP', value: device.geo?.isp },
            { label: 'Connection type', value: device.geo?.connectionType },
            { label: 'Location', value: device.geo, format: 'location' },
            { label: 'External IP address', value: device.externalAddress },
            { label: 'Internal IP address', value: device.internalAddress },
            { label: 'Device ID', value: device.id },
            { label: 'Hardware ID', value: device.hardwareID },
            { label: 'Daemon version', value: device.version },
            ...ATTRIBUTES.map(label => ({ label, value: device.attributes[label] })),
          ]}
        />
      </Gutters>
    </DeviceHeaderMenu>
  )
}
