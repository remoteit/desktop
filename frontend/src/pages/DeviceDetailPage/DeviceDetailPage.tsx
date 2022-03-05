import React, { useEffect } from 'react'
import { Gutters } from '../../components/Gutters'
import { DataDisplay } from '../../components/DataDisplay'
import { DeviceHeaderMenu } from '../../components/DeviceHeaderMenu'
import { deviceAttributes } from '../../components/Attributes'
import analyticsHelper from '../../helpers/analyticsHelper'

export const DeviceDetailPage: React.FC<{ device?: IDevice }> = ({ device }) => {
  useEffect(() => {
    analyticsHelper.page('DevicesDetailPage')
  }, [])

  if (!device) return null

  return (
    <DeviceHeaderMenu device={device}>
      <Gutters bottom={null}></Gutters>
      <Gutters>
        <DataDisplay attributes={deviceAttributes} device={device} />
      </Gutters>
    </DeviceHeaderMenu>
  )
}
