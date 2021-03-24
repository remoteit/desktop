import React, { useEffect } from 'react'
import { LEGACY_ATTRIBUTES } from '../../shared/constants'
import { TargetPlatform } from '../../components/TargetPlatform'
import { Notice } from '../../components/Notice'
import { Columns } from '../../components/Columns'
import { DataDisplay } from '../../components/DataDisplay'
import { QualityDetails } from '../../components/QualityDetails'
import { DeviceHeaderMenu } from '../../components/DeviceHeaderMenu'
import analyticsHelper from '../../helpers/analyticsHelper'

export const DeviceDetailPage: React.FC<{ device?: IDevice }> = ({ device }) => {
  useEffect(() => {
    analyticsHelper.page('DevicesDetailPage')
  }, [])

  if (!device) return null

  return (
    <DeviceHeaderMenu device={device}>
      {device.state === 'inactive' && (
        <Notice severity="warning" gutterTop>
          Device offline
        </Notice>
      )}
      <Columns count={1} inset>
        {/* {!editable && <AdminPanelConnect device={device} connections={connections} />} */}
        <DataDisplay
          data={[
            { label: 'Device Name', value: device.name },
            { label: 'Platform', value: TargetPlatform({ id: device.targetPlatform, label: true }), format: 'element' },
            {
              label: 'Internet Connectivity',
              format: 'element',
              value: <QualityDetails device={device} />,
            },
            { label: 'Owner', value: device.owner.email },
            { label: 'Last reported', value: device.lastReported, format: 'duration' },
            { label: 'ISP', value: device.geo?.isp },
            { label: 'Connection type', value: device.geo?.connectionType },
            { label: 'Location', value: device.geo, format: 'location' },
            { label: 'External IP address', value: device.externalAddress },
            { label: 'Internal IP address', value: device.internalAddress },
            { label: 'Device ID', value: device.id },
            { label: 'Hardware ID', value: device.hardwareID },
            { label: 'Daemon version', value: device.version },
            ...LEGACY_ATTRIBUTES.map(label => ({ label, value: device.attributes[label] })),
          ]}
        />
      </Columns>
    </DeviceHeaderMenu>
  )
}
