import React, { useState } from 'react'
import { ITimeSeriesData } from '../../models/analytics'
import { ResponsiveBar } from '@nivo/bar'
import { Typography } from '@material-ui/core'
import { colors } from '../../styling'
import { makeStyles } from '@material-ui/core/styles'

type ReportTimeSeriesBoxProps = {
  title: string
  timeseriesData: ITimeSeriesData[]
  tooltipLabel: string
}

const theme = {
  axis: {
    ticks: {
      line: {
        stroke: '#e9ecee',
        strokeWidth: 0,
      },
      text: {
        fill: '#919eab',
        fontFamily: 'Nunito',
      },
    },
  },
  grid: {
    line: {
      stroke: '#e9ecee',
      strokeWidth: 0.5,
    },
  },
  legends: {
    text: {
      fontFamily: 'Nunito',
    },
  },
}
export const ReportTimeSeries: React.FC<ReportTimeSeriesBoxProps> = (props: ReportTimeSeriesBoxProps) => {
  const css = useStyles()

  return (
    <div className={css.timeseries}>
      <Typography>{props.title}</Typography>
      <ResponsiveBar
        colors={colors.primary}
        borderColor={colors.primary}
        data={props.timeseriesData}
        keys={['count']}
        indexBy="date"
        axisLeft={{
          tickValues: 1,
          tickSize: 0,
          tickPadding: 3,
          tickRotation: 0,
        }}
        axisBottom={{
          tickValues: 10,
          tickSize: 1,
          tickPadding: 5,
          tickRotation: -90,
        }}
        label={d => `${d.id}: ${d.value}`}
        enableGridY={true}
        margin={{ top: 0, right: 0, bottom: 100, left: 20 }}
        padding={0.3}
        valueScale={{ type: 'linear' }}
        indexScale={{ type: 'band', round: true }}
        enableLabel={false}
        tooltip={({ id, value }) => <div>{`${props.tooltipLabel} ${value}`}</div>}
      />
    </div>
  )
}
const useStyles = makeStyles({
  timeseries: {
    height: 300,
    width: '100%',
  },
})
