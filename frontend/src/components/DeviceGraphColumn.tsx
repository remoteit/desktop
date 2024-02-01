import React, { useContext } from 'react'
import { DeviceListContext } from '../services/Context'
import { GraphColumn } from './GraphColumn'

export const DeviceGraphColumn: React.FC = () => {
  const { device } = useContext(DeviceListContext)
  return <GraphColumn title="Device Graph" timeSeries={device?.timeSeries} />
}
