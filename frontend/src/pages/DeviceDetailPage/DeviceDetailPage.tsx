import React, { useContext } from 'react'
import { DeviceContext } from '../../services/Context'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { DeviceHeaderMenu } from '../../components/DeviceHeaderMenu'
import { selectDeviceAttributes } from '../../selectors/devices'
import { selectLimitsLookup } from '../../selectors/organizations'
import { LoadingMessage } from '../../components/LoadingMessage'
import { DataDisplay } from '../../components/DataDisplay'
import { Gutters } from '../../components/Gutters'

export const DeviceDetailPage: React.FC = () => {
  const { device } = useContext(DeviceContext)
  const { limits, attributes } = useSelector((state: ApplicationState) => ({
    limits: selectLimitsLookup(state, device?.accountId),
    attributes: selectDeviceAttributes(state),
  }))

  if (!device?.loaded) return <LoadingMessage message="loading..." spinner={false} />

  return (
    <DeviceHeaderMenu>
      <Gutters>
        <DataDisplay attributes={attributes} device={device} instance={device} limits={limits} />
      </Gutters>
    </DeviceHeaderMenu>
  )
}
