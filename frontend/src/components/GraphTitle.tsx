import React from 'react'
import { selectTimeSeries } from '../selectors/ui'
import { TimeSeriesTypeLookup } from '../helpers/dateHelper'
import { useSelector } from 'react-redux'
import { State } from '../store'

type Props = {
  variant?: 'device' | 'service'
}

export const GraphTitle: React.FC<Props> = ({ variant = 'device' }) => {
  const timeSeries = useSelector((state: State) => selectTimeSeries(state)[`${variant}TimeSeries`])
  return <>{TimeSeriesTypeLookup[timeSeries.type]}</>
}
