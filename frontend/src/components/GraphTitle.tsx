import React from 'react'
import { TimeSeriesTypeLookup } from '../helpers/dateHelper'
import { ApplicationState } from '../store'
import { useSelector } from 'react-redux'

type Props = {
  variant?: 'device' | 'service'
}

export const GraphTitle: React.FC<Props> = ({ variant = 'device' }) => {
  const timeSeries = useSelector((state: ApplicationState) => state.ui[`${variant}TimeSeries`])
  return <>{TimeSeriesTypeLookup[timeSeries.type]}</>
}
