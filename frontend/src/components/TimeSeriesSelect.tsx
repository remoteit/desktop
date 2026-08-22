import React from 'react'
import {
  TimeSeriesTypeLookup,
  TimeSeriesAvailableResolutions,
  TimeSeriesAvailableStyles,
  TimeSeriesHeatmapResolutions,
  TimeSeriesLengths,
  timeSeriesLengthUnit,
  timeSeriesWithStyle,
  timeSeriesStyleLabel,
  timeSeriesTypeLabel,
  timeSeriesResolutionLabel,
} from '../helpers/dateHelper'
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
  const heatmap = timeSeriesOptions.style === 'heatmap'

  const resolutions = heatmap ? TimeSeriesHeatmapResolutions : Object.keys(TimeSeriesAvailableResolutions)
  const lengthUnit = timeSeriesLengthUnit(timeSeriesOptions)
  const lengths = TimeSeriesLengths[lengthUnit]

  return (
    <List>
      <SelectSetting
        icon="chart-column"
        label={t('timeSeriesSelect.graphType', 'Graph type')}
        value={timeSeriesOptions.type}
        defaultValue={defaults.type}
        values={Object.keys(TimeSeriesTypeLookup).map(key => ({ key, name: timeSeriesTypeLabel(key) }))}
        onChange={value => onChange?.({ ...timeSeriesOptions, type: value as ITimeSeriesType })}
      />
      <SelectSetting
        icon="grid-2"
        label={t('timeSeriesSelect.graphStyle', 'Graph style')}
        value={timeSeriesOptions.style ?? 'bar'}
        defaultValue={defaults.style}
        values={Object.keys(TimeSeriesAvailableStyles).map(key => ({ key, name: timeSeriesStyleLabel(key) }))}
        onChange={value => onChange?.(timeSeriesWithStyle(timeSeriesOptions, value as ITimeSeriesStyle, limitDuration))}
      />
      <SelectSetting
        icon="timer"
        label={t('timeSeriesSelect.graphUnit', 'Graph unit')}
        value={timeSeriesOptions.resolution}
        defaultValue={defaults.resolution}
        values={resolutions.map(key => {
          // A heat map's shortest span is a number of days, not of `key`, so the
          // limit is measured in whichever unit that resolution's length counts.
          const unit = heatmap ? 'DAY' : key
          const disabled =
            limitDuration.valueOf() < Duration.fromObject({ [unit]: TimeSeriesLengths[unit][0] }).valueOf()
          return {
            key,
            name: timeSeriesResolutionLabel(key) + (disabled ? overLimitLabel : ''),
            disabled,
          }
        })}
        onChange={value =>
          onChange?.({
            ...timeSeriesOptions,
            resolution: value as ITimeSeriesResolution,
            length: heatmap ? timeSeriesOptions.length : TimeSeriesLengths[value][0],
          })
        }
      />
      <SelectSetting
        icon="ruler"
        label={t('timeSeriesSelect.graphLength', 'Graph length')}
        value={timeSeriesOptions.length}
        defaultValue={defaults.length}
        values={lengths.map(key => {
          const disabled = limitDuration.valueOf() < Duration.fromObject({ [lengthUnit]: key }).valueOf()
          return {
            key,
            name:
              t('timeSeriesSelect.lengthValue', {
                count: Number(key),
                unit: timeSeriesResolutionLabel(lengthUnit),
                defaultValue_one: '{{count}} {{unit}}',
                defaultValue_other: '{{count}} {{unit}}s',
              }) + (disabled ? overLimitLabel : ''),
            disabled,
          }
        })}
        onChange={value =>
          onChange?.({
            ...timeSeriesOptions,
            length: +value,
          })
        }
      />
    </List>
  )
}
