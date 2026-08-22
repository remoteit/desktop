import React from 'react'
import {
  TimeSeriesTypeLookup,
  TimeSeriesAvailableResolutions,
  TimeSeriesAvailableStyles,
  TimeSeriesHeatmapDays,
  TimeSeriesHeatmapResolutions,
  TimeSeriesLengths,
  defaultHeatmapResolution,
  findLongestLength,
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

  // A heat map is always a grid of days, so its length is picked in days and
  // its resolution sets the rows within each day.
  const resolutions = heatmap ? TimeSeriesHeatmapResolutions : TimeSeriesAvailableResolutions
  const lengthUnit = heatmap ? 'DAY' : timeSeriesOptions.resolution
  const lengths = heatmap ? TimeSeriesHeatmapDays : TimeSeriesLengths[timeSeriesOptions.resolution]

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
        onChange={value => onChange?.(withStyle(timeSeriesOptions, value as ITimeSeriesStyle, limitDuration))}
      />
      <SelectSetting
        icon="timer"
        label={t('timeSeriesSelect.graphUnit', 'Graph unit')}
        value={timeSeriesOptions.resolution}
        defaultValue={heatmap ? undefined : defaults.resolution}
        values={Object.keys(resolutions).map(key => {
          const disabled = limitDuration.valueOf() < Duration.fromObject({ [key]: TimeSeriesLengths[key][0] }).valueOf()
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
        defaultValue={heatmap ? undefined : defaults.length}
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

// Switching style re-scopes resolution and length, since a bar graph counts
// buckets and a heat map counts days. Both directions land on the longest span
// the plan's log limit allows rather than silently asking for more than it has.
const withStyle = (
  options: ITimeSeriesOptions,
  style: ITimeSeriesStyle,
  limitDuration: Duration
): ITimeSeriesOptions => {
  // Settings saved before graph style existed have no style at all, and they
  // are bar graphs — picking Bar on one of those should leave it alone.
  if (style === (options.style ?? 'bar')) return options
  if (style === 'bar')
    return {
      ...options,
      style,
      resolution: 'DAY',
      length: findLongestLength(limitDuration, 'DAY') ?? TimeSeriesLengths.DAY[0],
    }

  return {
    ...options,
    style,
    resolution: defaultHeatmapResolution,
    length: findLongestLength(limitDuration, 'DAY', TimeSeriesHeatmapDays) ?? TimeSeriesHeatmapDays[0],
  }
}
