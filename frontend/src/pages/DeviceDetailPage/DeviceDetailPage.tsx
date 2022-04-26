import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { DeviceHeaderMenu } from '../../components/DeviceHeaderMenu'
import { deviceAttributes } from '../../components/Attributes'
import { selectLimitsLookup } from '../../models/organization'
import { DataDisplay } from '../../components/DataDisplay'
import { Gutters } from '../../components/Gutters'
import analyticsHelper from '../../helpers/analyticsHelper'

export const DeviceDetailPage: React.FC<{ device?: IDevice }> = ({ device }) => {
  const limits = useSelector((state: ApplicationState) => selectLimitsLookup(state, device?.accountId))

  useEffect(() => {
    analyticsHelper.page('DevicesDetailPage')
  }, [])

  if (!device) return null

  return (
    <DeviceHeaderMenu device={device}>
      <Gutters>
        <DataDisplay attributes={deviceAttributes} device={device} limits={limits} />
      </Gutters>
    </DeviceHeaderMenu>
  )
}
