import React, { useEffect } from 'react'
import { Gutters } from '../../components/Gutters'
import { DataDisplay } from '../../components/DataDisplay'
import { DeviceHeaderMenu } from '../../components/DeviceHeaderMenu'
import { deviceDetails } from '../../hooks/useDeviceDetails'
import analyticsHelper from '../../helpers/analyticsHelper'

export const DeviceDetailPage: React.FC<{ device?: IDevice }> = ({ device }) => {
  useEffect(() => {
    analyticsHelper.page('DevicesDetailPage')
  }, [])

  if (!device) return null

  return (
    <DeviceHeaderMenu device={device}>
      <Gutters>
        {/* {!editable && <AdminPanelConnect device={device} connections={connections} />} */}
        <DataDisplay data={deviceDetails} />
      </Gutters>
    </DeviceHeaderMenu>
  )
}
