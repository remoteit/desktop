import React from 'react'
import { TimeSeriesTypeLookup, TimeSeriesAvailableResolutions, TimeSeriesLengths } from '../helpers/dateHelper'
import { SelectSetting } from './SelectSetting'
import { Duration } from 'luxon'
import { List } from '@mui/material'
import { useTranslation } from 'react-i18next'

type Props = {
  timeSeriesOptions: ITimeSeriesOptions
  logLimit: string
  defaults: ITimeSeriesOptions
  onChange?: (value: ITimeSeriesOptions) => void
}

export const TimeSeriesSelect: React.FC<Props> = ({ timeSeriesOptions, logLimit, defaults, onChange }) => {
  const limitDuration = Duration.fromISO(logLimit)
  const { t } = useTranslation()
  const overLimitLabel = t('timeSeriesSelect.overLimit', ' (over limit)')
  return (
    <List>
      <SelectSetting
        icon="chart-column"
        label={t('timeSeriesSelect.graphType', 'Graph type')}
        value={timeSeriesOptions.type}
        defaultValue={defaults.type}
        values={Object.keys(TimeSeriesTypeLookup).map(key => ({ key, name: TimeSeriesTypeLookup[key] }))}
        onChange={value => onChange?.({ ...timeSeriesOptions, type: value as ITimeSeriesType })}
      />
      <SelectSetting
        icon="timer"
        label={t('timeSeriesSelect.graphUnit', 'Graph unit')}
        value={timeSeriesOptions.resolution}
        defaultValue={defaults.resolution}
        values={Object.keys(TimeSeriesAvailableResolutions).map(key => {
          const disabled = limitDuration.valueOf() < Duration.fromObject({ [key]: TimeSeriesLengths[key][0] }).valueOf()
          return {
            key,
            name: TimeSeriesAvailableResolutions[key] + (disabled ? overLimitLabel : ''),
            disabled,
          }
        })}
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
        label={t('timeSeriesSelect.graphLength', 'Graph length')}
        value={timeSeriesOptions.length}
        defaultValue={defaults.length}
        values={TimeSeriesLengths[timeSeriesOptions.resolution].map(key => {
          const disabled =
            limitDuration.valueOf() < Duration.fromObject({ [timeSeriesOptions.resolution]: key }).valueOf()
          return {
            key,
            name: `${key} ${TimeSeriesAvailableResolutions[timeSeriesOptions.resolution]}s${
              disabled ? overLimitLabel : ''
            }`,
            disabled,
          }
        })}
        onChange={value => onChange?.({ ...timeSeriesOptions, length: +value })}
      />
    </List>
  )
}
