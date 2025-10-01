import React, { useMemo } from 'react'
import { useTheme, makeStyles } from '@mui/styles'
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
  const css = useStyles({ height })

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
    <svg width={width} height={height + 1} className={css.graph} {...props}>
      {bars.map((bar, i) => [
        <rect key={i} x={bar.x} y={bar.y} width={bar.width - 1} height={bar.height} fill={theme.palette[color].main} />,
        onHover && (
          <rect
            key={`${i}-bg`}
            x={bar.x}
            y={0}
            width={bar.width}
            height={height}
            className={css.bar}
            onMouseOver={() => onHover([data.time[i], data.data[i]])}
            onMouseOut={() => onHover(undefined)}
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
    borderLeft: `1px solid ${palette.gray.main}`,
    borderBottom: `1px solid ${palette.gray.main}`,
  }),
  bar: {
    fill: 'transparent',
    '&:hover': { fill: palette.screen.main },
  },
}))
