import React from 'react'
import { SelectSetting } from './SelectSetting'
import { TimeSeriesTypeLookup, TimeSeriesResolutionLookup } from '../helpers/dateHelper'

type Props = {
  timeSeries: ITimeSeriesOptions
  logLimit: string
  onChange?: (value: ITimeSeriesOptions) => void
}

export const TimeSeriesSelect: React.FC<Props> = ({ timeSeries, logLimit, onChange }) => {
  return (
    <>
      <SelectSetting
        icon="chart-column"
        label="Graph type"
        value={timeSeries.type}
        values={Object.keys(TimeSeriesTypeLookup).map(key => ({ key, name: TimeSeriesTypeLookup[key] }))}
        onChange={value => onChange?.({ ...timeSeries, type: value as ITimeSeriesType })}
      />
      <SelectSetting
        icon="timer"
        label="Graph unit"
        value={timeSeries.resolution}
        values={Object.keys(TimeSeriesResolutionLookup).map(key => ({ key, name: TimeSeriesResolutionLookup[key] }))}
        onChange={value => onChange?.({ ...timeSeries, resolution: value as ITimeSeriesResolution })}
      />
    </>
  )
}
