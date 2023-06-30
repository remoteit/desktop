import React, { useEffect, useState } from 'react'
import { useTheme, makeStyles } from '@mui/styles'
import { Color } from '../styling'
import * as d3 from 'd3'

const HOUR_IN_SECONDS = 60 * 60

export type BarChartProps = React.HTMLAttributes<HTMLOrSVGElement> & {
  data: ITimeSeries
  width?: number
  height?: number
  color?: Color
  onHover?: (value?: [Date, number]) => void
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  width = 100,
  height = 18,
  color = 'grayDark',
  onHover,
  ...props
}) => {
  const theme = useTheme()
  const css = useStyles({ height })

  const [bars, setBars] = useState<{ x: number; y: number; width: number; height: number }[]>([])

  useEffect(() => {
    const xScale = d3
      .scaleUtc()
      .domain(d3.extent(data.time as Date[]))
      .range([0, width])

    const yScale = d3
      .scaleLinear()
      // Round up to nearest hour
      // .domain([0, Math.max(Math.ceil(d3.max(data.data) / HOUR_IN_SECONDS) * HOUR_IN_SECONDS, HOUR_IN_SECONDS)])

      // Fixed 24 hour max
      // .domain([0, HOUR_IN_SECONDS * 24])

      // Dynamic max
      .domain([0, Math.max(d3.max(data.data), 0.1)])
      .range([height, 0])

    const barWidth = width / data.data.length

    const newBars = data.data.map((d, i) => {
      const x = xScale(data.time![i])!
      const y = yScale(d)
      return { x, y, width: barWidth, height: height - y }
    })

    setBars(newBars)
  }, [data, width, height])

  return (
    <svg width={width} height={height} className={css.graph} {...props}>
      {bars.map((bar, i) => [
        <rect
          key={i}
          x={bar.x}
          y={bar.y}
          width={bar.width - 0.5}
          height={bar.height}
          fill={theme.palette[color].main}
        />,
        onHover && (
          <rect
            key={`$i-bg`}
            x={bar.x}
            y={0}
            width={bar.width + 0.5}
            height={height}
            className={css.bar}
            onMouseOver={() => onHover && onHover([data.time![i]!, data.data![i]!])}
            onMouseOut={() => onHover && onHover(undefined)}
          />
        ),
      ])}
    </svg>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  graph: ({ height }: { height: number }) => ({
    backgroundColor: palette.white.main,
    borderBottomLeftRadius: height / 8,
    borderBottomRightRadius: height / 8,
    borderLeft: `1px solid ${palette.grayDark.main}`,
    borderBottom: `1px solid ${palette.grayDark.main}`,
  }),
  bar: {
    fill: 'transparent',
    '&:hover': { fill: palette.screen.main },
  },
}))
