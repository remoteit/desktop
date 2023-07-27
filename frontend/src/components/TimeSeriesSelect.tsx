import React from 'react'
import {
  TimeSeriesTypeLookup,
  TimeSeriesAvailableResolutions,
  humanizeMaxResolutionLookup,
  TimeSeriesLengths,
  getMaxDuration,
} from '../helpers/dateHelper'
import { Typography, List } from '@mui/material'
import { SelectSetting } from './SelectSetting'
import { Gutters } from './Gutters'
import humanize from 'humanize-duration'

type Props = {
  timeSeriesOptions: ITimeSeriesOptions
  logLimit: string
  defaults: ITimeSeriesOptions
  onChange?: (value: ITimeSeriesOptions) => void
}

export const TimeSeriesSelect: React.FC<Props> = ({ timeSeriesOptions, logLimit, defaults, onChange }) => {
  return (
    <List>
      <SelectSetting
        icon="chart-column"
        label="Graph type"
        value={timeSeriesOptions.type}
        defaultValue={defaults.type}
        values={Object.keys(TimeSeriesTypeLookup).map(key => ({ key, name: TimeSeriesTypeLookup[key] }))}
        onChange={value => onChange?.({ ...timeSeriesOptions, type: value as ITimeSeriesType })}
      />
      <SelectSetting
        icon="timer"
        label="Graph unit"
        value={timeSeriesOptions.resolution}
        defaultValue={defaults.resolution}
        values={Object.keys(TimeSeriesAvailableResolutions).map(key => ({
          key,
          name: TimeSeriesAvailableResolutions[key],
        }))}
        onChange={value =>
          onChange?.({
            ...timeSeriesOptions,
            resolution: value as ITimeSeriesResolution,
            length: TimeSeriesLengths[value][0],
          })
        }
      />
      <SelectSetting
        icon="ruler"
        label="Graph length"
        value={timeSeriesOptions.length}
        defaultValue={defaults.length}
        values={TimeSeriesLengths[timeSeriesOptions.resolution].map(key => ({
          key,
          name: `${key} ${TimeSeriesAvailableResolutions[timeSeriesOptions.resolution]}s`,
        }))}
        onChange={value => onChange?.({ ...timeSeriesOptions, length: +value })}
      />
      <Gutters top={null} bottom={null} inset="icon">
        <Typography variant="caption" color="textSecondary">
          View last&nbsp;
          {humanize(getMaxDuration(timeSeriesOptions.resolution).toMillis(), {
            largest: 1,
            round: true,
            units: [humanizeMaxResolutionLookup[timeSeriesOptions.resolution || 'DAY']],
          })}
        </Typography>
      </Gutters>
    </List>
  )
}
