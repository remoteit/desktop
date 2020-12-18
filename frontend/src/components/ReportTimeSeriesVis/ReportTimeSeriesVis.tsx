import React, { useMemo } from 'react'
import { Bar } from '@visx/shape'
import { Group } from '@visx/group'
import { AxisBottom, AxisLeft } from '@visx/axis'
import { ITimeSeriesData } from '../../models/analytics'
import { scaleLinear, scaleBand } from '@visx/scale'
import { Grid } from '@visx/grid'
//import { useTooltip, useTooltipInPortal, defaultStyles } from '@visx/tooltip'
//import { makeStyles } from '@material-ui/core/styles'
import { colors } from '../../styling'
import { format as formatDate, max as maxDate, min as minDate } from 'date-fns'

const verticalMargin = 120

// accessors

export interface ReportTimeSeriesChartProps {
  title?: string
  timeseriesData: ITimeSeriesData[]
  tooltipLabel?: string
  width: number
  height: number
}

const formattedDate = (date: Date) => formatDate(date, 'MMM d, yyyy')
const getDate = (d: ITimeSeriesData) => d.date
const getCount = (d: ITimeSeriesData) => d.count
/*const tooltipStyles = {
  ...defaultStyles,
  minWidth: 60,
  backgroundColor: colors.grayLightest,
  color: colors.grayDarker,
}*/

export const ReportTimeSeriesVis: React.FC<ReportTimeSeriesChartProps> = ({
  title,
  timeseriesData,
  tooltipLabel,
  width,
  height,
}) => {
  if (width < 10) return null
  /*const { tooltipOpen, tooltipTop, tooltipLeft, hideTooltip, showTooltip, tooltipData } = useTooltip()

  let toolTipTimeout
  const { containerRef, TooltipInPortal } = useTooltipInPortal()
 */
  // bounds
  const xMax = width - verticalMargin
  const yMax = height - verticalMargin

  // scales, memoize for performance
  const xScale = scaleBand({
    range: [0, xMax],
    round: true,
    domain: timeseriesData.map(getDate),
    padding: 0.2,
  })
  const yScale = scaleLinear<number>({
    range: [yMax, 0],
    round: true,
    nice: true,
    domain: [0, Math.max(...timeseriesData.map(getCount))],
  })
  return (
    <div style={{ position: 'relative' }}>
      <svg width={width} height={height}>
        <Grid
          top={verticalMargin}
          left={10}
          xScale={xScale}
          yScale={yScale}
          width={xMax}
          height={yMax}
          stroke={colors.grayLighter}
          strokeOpacity={0.1}
          xOffset={0}
        />
        <Group top={verticalMargin}>
          <AxisLeft
            left={10}
            scale={yScale}
            hideTicks={true}
            hideZero={true}
            numTicks={5}
            stroke={colors.gray}
            tickStroke={colors.gray}
          />
          {timeseriesData.map(d => {
            const label = getDate(d)
            const barWidth = xScale.bandwidth()
            const barHeight = yMax - (yScale(getCount(d)) ?? 0)
            const barX = xScale(label)
            const barY = yMax - barHeight
            return (
              <Bar key={`bar-${label}`} x={barX} y={barY} width={barWidth} height={barHeight} color={colors.primary} />
            )
          })}
          <AxisBottom
            top={yMax + verticalMargin}
            scale={xScale}
            tickFormat={formattedDate}
            stroke={colors.gray}
            tickStroke={colors.primary}
            tickLabelProps={() => ({
              fill: colors.gray,
              fontSize: 11,
              textAnchor: 'middle',
            })}
          />
        </Group>
      </svg>
    </div>
  )
}
