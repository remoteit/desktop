import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { DeviceHeaderMenu } from '../../components/DeviceHeaderMenu'
import { deviceAttributes } from '../../components/Attributes'
import { DataDisplay } from '../../components/DataDisplay'
import { Gutters } from '../../components/Gutters'
import analyticsHelper from '../../helpers/analyticsHelper'

export const DeviceDetailPage: React.FC<{ device?: IDevice }> = ({ device }) => {
  const feature = useSelector((state: ApplicationState) => state.ui.feature)

  useEffect(() => {
    analyticsHelper.page('DevicesDetailPage')
  }, [])

  if (!device) return null

  return (
    <DeviceHeaderMenu device={device}>
      <Gutters bottom={null}></Gutters>
      <Gutters>
        <DataDisplay attributes={deviceAttributes} device={device} feature={feature} />
      </Gutters>
    </DeviceHeaderMenu>
  )
}
