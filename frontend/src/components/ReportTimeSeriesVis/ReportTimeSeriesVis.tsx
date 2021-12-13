import React from 'react'
import { useTooltip, useTooltipInPortal, defaultStyles } from '@visx/tooltip'
import { localPoint } from '@visx/event'
import { Bar } from '@visx/shape'
import { Group } from '@visx/group'
import { AxisBottom, AxisLeft } from '@visx/axis'
import { ITimeSeriesData } from '../../models/analytics'
import { scaleBand, scaleLinear } from '@visx/scale'
import { spacing } from '../../styling'
import { format as formatDate, max as maxDate, min as minDate } from 'date-fns'
import { Typography } from '@material-ui/core'
import theme from '../../styling/theme'

// accessors

export interface ReportTimeSeriesChartProps {
  title?: string
  timeseriesData: ITimeSeriesData[]
  tooltipLabel?: string
  width: number
  height: number
}
export type TooltipProps = {
  width: number
  height: number
  showControls?: boolean
}

type TooltipData = ITimeSeriesData

const positionIndicatorSize = 8
const formattedDate = (date: Date) => formatDate(date, 'MMM d')

const getDate = (d: ITimeSeriesData) => formattedDate(d.date)
const getCount = (d: ITimeSeriesData) => Math.round(d.count)

const tooltipStyles = {
  ...defaultStyles,
  minWidth: 60,
  backgroundColor: theme.palette.grayLighter,
  color: theme.palette.grayDark,
}
let tooltipTimeout

export const ReportTimeSeriesVis: React.FC<ReportTimeSeriesChartProps> = ({
  title,
  timeseriesData,
  tooltipLabel,
  width,
  height,
}) => {
  const { containerRef, containerBounds, TooltipInPortal } = useTooltipInPortal({
    scroll: true,
    detectBounds: true,
  })

  const {
    showTooltip,
    hideTooltip,
    tooltipOpen,
    tooltipData,
    tooltipLeft = 0,
    tooltipTop = 0,
  } = useTooltip<TooltipData>({
    // initial tooltip state
    tooltipOpen: false,
    tooltipLeft: width / 3,
    tooltipTop: height / 3,
    tooltipData: { date: new Date(), count: 0 },
  })

  const maxYTick = Math.round(
    Math.max.apply(
      Math,
      timeseriesData.map(function (d) {
        return d.count
      })
    )
  )
  const yTickValues = () => {
    if (maxYTick > 1) {
      return [0, Math.round(maxYTick / 2), Math.round(maxYTick)]
    } else {
      return [0, 1]
    }
  }

  if (width < 10) return null

  const margin = {
    top: spacing.lg,
    bottom: spacing.lg,
    left: spacing.lg,
    right: 0,
  }
  const xMax = width - margin.left - margin.right - 10
  const yMax = Math.round(height - margin.top - margin.bottom)
  //handle the tooltip
  const handleMouseOver = (event, datum) => {
    if (tooltipTimeout) clearTimeout(tooltipTimeout)
    const coords = localPoint(event.target.ownerSVGElement, event)
    showTooltip({
      tooltipLeft: coords ? coords.x : 0,
      tooltipTop: coords ? coords.y : 0,
      tooltipData: datum,
    })
  }

  // scales, memoize for performance
  const xScale = scaleBand({
    range: [0, xMax],
    domain: timeseriesData.map(getDate),
    padding: 0.2,
  })
  const yScale = scaleLinear<number>({
    range: [yMax, 0],
    round: true,
    nice: true,
    domain: [0, Math.max(2, maxYTick)],
  })
  console.log('yScale', yScale)
  return (
    <>
      <Typography variant="h4">{title}</Typography>
      <svg width={width} height={height} ref={containerRef}>
        <Group top={margin.top} left={margin.left}>
          <AxisLeft
            left={0}
            scale={yScale}
            stroke={theme.palette.gray}
            hideZero={false}
            tickValues={yTickValues()}
            tickFormat={d => (+d).toString()}
          />
          <AxisBottom scale={xScale} numTicks={5} top={yMax} stroke={theme.palette.gray} />
          {timeseriesData.map(d => {
            const label = getDate(d)
            const barWidth = xScale.bandwidth()
            const yLabel = yScale(getCount(d))
            const barHeight = yMax - yLabel
            const barX = xScale(label)
            const barY = yMax - barHeight
            return (
              <Bar
                width={barWidth}
                height={barHeight}
                x={barX}
                y={barY}
                fill={theme.palette.primary.main}
                onMouseEnter={e => handleMouseOver(e, { date: label, count: d.count })}
                onMouseOut={() =>
                  (tooltipTimeout = setTimeout(() => {
                    hideTooltip()
                  }, 300))
                }
                key={`bar-${label}`}
                stroke={''}
              />
            )
          })}
        </Group>
      </svg>
      {tooltipOpen && (
        <TooltipInPortal
          key={Math.random()} // update tooltip bounds each render
          top={tooltipTop}
          left={tooltipLeft}
          style={tooltipStyles}
        >
          <div>{tooltipData && tooltipData.date}</div>
          <div>
            {tooltipData && tooltipData.count} {tooltipLabel}
          </div>
        </TooltipInPortal>
      )}
    </>
  )
}
