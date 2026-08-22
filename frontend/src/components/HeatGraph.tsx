import React, { useMemo } from 'react'
import { Box, useTheme } from '@mui/material'
import { heatmapGrid } from '../helpers/dateHelper'
import * as d3 from 'd3'

// Light to dark stops for each color the graphs use, so a cell's depth reads as
// "more of this" rather than as a different thing.
const RAMPS: ILookup<[Color, Color, Color]> = {
  primary: ['primaryLighter', 'primaryLight', 'primaryDark'],
  success: ['successLight', 'success', 'successDark'],
  gray: ['grayLight', 'gray', 'grayDarker'],
}

export type HeatGraphProps = React.HTMLAttributes<HTMLOrSVGElement> & {
  data: ITimeSeries
  rows?: number
  width?: number
  height?: number
  max?: number
  color?: Color
  onHover?: (value?: [Date, number]) => void
}

export const HeatGraph: React.FC<HeatGraphProps> = ({
  data,
  rows = 24,
  width = 100,
  height = 18,
  max,
  color = 'grayDark',
  onHover,
  ...props
}) => {
  const theme = useTheme()
  const grid = useMemo(() => heatmapGrid(data, rows), [data, rows])

  const scale = useMemo(() => {
    const ramp = (RAMPS[color] ?? RAMPS.gray).map(c => theme.palette[c].main)
    // The palette's lightest step is still saturated enough that a barely used
    // hour and a half used one read the same, so the ramp starts from a tint of
    // it mixed toward the surface — which also keeps it correct in dark mode.
    // Interpolating in RGB rather than HCL, which leaves the sRGB gamut on the
    // way out of white and clips back to a color brighter than the ramp itself.
    const lightest = d3.interpolateRgb(theme.palette.white.main, ramp[0])(0.3)
    // Fall back to the series' own peak when the type has no ceiling (event
    // counts), otherwise every cell would sit at the bottom of the ramp.
    const top = max ?? Math.max(d3.max(data.data) ?? 0, 0.1)
    return d3
      .scaleLinear<string>()
      .domain([0, top / 3, (top * 2) / 3, top])
      .range([lightest, ...ramp])
      .interpolate(d3.interpolateRgb)
      .clamp(true)
  }, [color, max, data, theme])

  const cellWidth = width / Math.max(grid.columns.length, 1)
  const cellHeight = height / rows

  return (
    <Box
      component="svg"
      width={width}
      height={height}
      sx={theme => ({
        backgroundColor: theme.palette.white.main,
        '& .cell:hover': { stroke: theme.palette.grayDarkest.main, strokeWidth: 1 },
      })}
      {...props}
    >
      {grid.columns.map((column, x) =>
        column.values.map((value, y) =>
          value === undefined ? null : (
            <rect
              key={`${column.key}-${y}`}
              className={onHover ? 'cell' : undefined}
              x={x * cellWidth}
              y={y * cellHeight}
              width={Math.max(cellWidth - 1, 1)}
              height={Math.max(cellHeight - 1, 1)}
              fill={value > 0 ? scale(value) : theme.palette.grayLighter.main}
              onMouseOver={onHover && (() => onHover([hourOf(column.date, y, rows), value]))}
              onMouseOut={onHover && (() => onHover(undefined))}
            />
          )
        )
      )}
    </Box>
  )
}

// The date a cell stands for — its column's day plus the row's offset into that
// day, so the tooltip can name the hour the cell covers.
const hourOf = (date: Date, row: number, rows: number) => new Date(date.getTime() + (row * 86400000) / rows)
