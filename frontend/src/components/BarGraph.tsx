import React, { useMemo } from 'react'
import { Box, useTheme } from '@mui/material'
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
  max = Math.max(d3.max(data.data) ?? 0, 0.1),
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

    return data.data.map((d, i) => ({
      x: xScale(data.time[i].toISOString()) ?? 0,
      y: yScale(d),
      width: xScale.bandwidth(),
      height: height - yScale(d),
    }))
  }, [data, width, height, min, max])

  return (
    <Box
      component="svg"
      width={width}
      height={height + 1}
      viewBox={`0 0 ${width} ${height + 1}`}
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
        <rect key={i} x={bar.x} y={bar.y} width={bar.width - 1} height={bar.height} fill={theme.palette[color].main} />,
        onHover && (
          <rect
            key={`${i}-bg`}
            className="bar"
            x={bar.x}
            y={0}
            width={bar.width}
            height={height}
            onMouseOver={() => onHover([data.time[i], data.data[i]])}
            onMouseOut={() => onHover(undefined)}
          />
        ),
      ])}
    </Box>
  )
}
