import React, { useContext } from 'react'
import { State } from '../store'
import { useSelector } from 'react-redux'
import { DeviceContext } from '../services/Context'
import { DeviceHeaderMenu } from '../components/DeviceHeaderMenu'
import { selectDeviceDetailAttributes } from '../selectors/devices'
import { selectLimitsLookup } from '../selectors/organizations'
import { DataDisplay } from '../components/DataDisplay'
import { GraphItem } from '../components/GraphItem'
import { Gutters } from '../components/Gutters'

export const DeviceDetailPage: React.FC = () => {
  const { device } = useContext(DeviceContext)
  const limits = useSelector((state: State) => selectLimitsLookup(state, device?.accountId))
  const attributes = useSelector(selectDeviceDetailAttributes)

  return (
    <DeviceHeaderMenu>
      <GraphItem device={device} />
      <Gutters>
        <DataDisplay attributes={attributes} device={device} instance={device} limits={limits} />
      </Gutters>
    </DeviceHeaderMenu>
  )
}
