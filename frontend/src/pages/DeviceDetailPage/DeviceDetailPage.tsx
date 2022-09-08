import React, { useContext } from 'react'
import { DeviceContext } from '../../services/Context'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { DeviceHeaderMenu } from '../../components/DeviceHeaderMenu'
import { deviceAttributes } from '../../components/Attributes'
import { selectLimitsLookup } from '../../models/organization'
import { DataDisplay } from '../../components/DataDisplay'
import { Gutters } from '../../components/Gutters'

export const DeviceDetailPage: React.FC = () => {
  const { device } = useContext(DeviceContext)
  const limits = useSelector((state: ApplicationState) => selectLimitsLookup(state, device?.accountId))

  if (!device) return null

  return (
    <DeviceHeaderMenu>
      <Gutters>
        <DataDisplay attributes={deviceAttributes} device={device} limits={limits} />
      </Gutters>
    </DeviceHeaderMenu>
  )
}
