import React, { useContext } from 'react'
import { DeviceContext } from '../../services/Context'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { DeviceHeaderMenu } from '../../components/DeviceHeaderMenu'
import { selectDeviceDetailAttributes } from '../../selectors/devices'
import { selectLimitsLookup } from '../../selectors/organizations'
import { DataDisplay } from '../../components/DataDisplay'
import { GraphItem } from '../../components/GraphItem'
import { Gutters } from '../../components/Gutters'

export const DeviceDetailPage: React.FC = () => {
  const { device } = useContext(DeviceContext)
  const { limits, attributes } = useSelector((state: ApplicationState) => ({
    limits: selectLimitsLookup(state, device?.accountId),
    attributes: selectDeviceDetailAttributes(state),
  }))

  return (
    <DeviceHeaderMenu>
      <GraphItem device={device} />
      <Gutters>
        <DataDisplay attributes={attributes} device={device} instance={device} limits={limits} />
      </Gutters>
    </DeviceHeaderMenu>
  )
}
