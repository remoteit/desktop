import React, { useContext } from 'react'
import { DeviceListContext } from '../services/Context'
import { GraphColumn } from './GraphColumn'

export const ServiceGraphColumn: React.FC = () => {
  const { service } = useContext(DeviceListContext)
  return <GraphColumn title="Service Graph" timeSeries={service?.timeSeries} />
}
