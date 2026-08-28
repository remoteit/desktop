import React, { useMemo } from 'react'
import { Box, useTheme } from '@mui/material'
import { timeSeriesMax } from '../helpers/dateHelper'
import * as d3 from 'd3'

export type BarGraphProps = React.HTMLAttributes<HTMLOrSVGElement> & {
  data: ITimeSeries
  width?: number
  height?: number
  max?: number
  min?: number
  color?: Color
  onHover?: (value?: [Date, number]) => void
}

export const BarGraph: React.FC<BarGraphProps> = ({
  data,
  width = 100,
  height = 18,
  max = timeSeriesMax(data.data),
  min = 0,
  color = 'grayDark',
  onHover,
  ...props
}) => {
  const theme = useTheme()

  const bars = useMemo(() => {
    const xScale = d3
      .scaleBand()
      .domain(data.time.map(d => d.toISOString()))
      .range([0, width])
    const yScale = d3.scaleLinear().domain([min, max]).range([height, 0])

    return data.data.map((d, i) => {
      // Anything that happened gets at least a pixel. Against an absolute scale
      // a short value is otherwise sub-pixel and vanishes — 17 minutes of
      // connection in a day is 0.2px in an 18px column — so "briefly" and
      // "never" would draw identically.
      const barHeight = Math.max(height - yScale(d), d > 0 ? 1 : 0)
      return {
        x: xScale(data.time[i].toISOString()) ?? 0,
        y: height - barHeight,
        // A 1px gap between bars, but never a zero or negative width — an hourly
        // series can land in a list column narrower than it has buckets.
        width: Math.max(xScale.bandwidth() - 1, 0.5),
        hitWidth: xScale.bandwidth(),
        height: barHeight,
      }
    })
  }, [data, width, height, min, max])

  return (
    <Box
      component="svg"
      width={width}
      height={height + 1}
      sx={theme => ({
        backgroundColor: theme.palette.white.main,
        borderBottomLeftRadius: `${height / 8}px`,
        borderLeft: `1px solid ${theme.palette.gray.main}`,
        borderBottom: `1px solid ${theme.palette.gray.main}`,
        '& .bar': { fill: 'transparent' },
        '& .bar:hover': { fill: theme.palette.screen.main },
      })}
      {...props}
    >
      {bars.map((bar, i) => [
        <rect key={i} x={bar.x} y={bar.y} width={bar.width} height={bar.height} fill={theme.palette[color].main} />,
        onHover && (
          <rect
            key={`${i}-bg`}
            className="bar"
            x={bar.x}
            y={0}
            width={bar.hitWidth}
            height={height}
            onMouseOver={() => onHover([data.time[i], data.data[i]])}
            onMouseOut={() => onHover(undefined)}
          />
        ),
      ])}
    </Box>
  )
}
