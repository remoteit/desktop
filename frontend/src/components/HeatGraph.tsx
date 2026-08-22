import React, { useMemo } from 'react'
import { Box, useTheme } from '@mui/material'
import { heatmapGrid, timeSeriesMax } from '../helpers/dateHelper'
import * as d3 from 'd3'

export type HeatColor = 'primary' | 'success' | 'gray'

// Light to dark stops for each color the graphs use, so a cell's depth reads as
// "more of this" rather than as a different thing.
const RAMPS: Record<HeatColor, [Color, Color, Color]> = {
  primary: ['primaryLighter', 'primaryLight', 'primaryDark'],
  success: ['successLight', 'success', 'successDark'],
  // Ends at the body text color, not at a disabled gray — an offline device's
  // history is still history, and the pale end of a disabled ramp is invisible
  // against the surface for exactly the low-availability devices worth spotting.
  gray: ['gray', 'grayDarker', 'grayDarkest'],
}

// The success and gray steps swap between light and dark mode, so their ramp
// already points from "least" to "most" in both. The primary ones do not —
// primaryDark is the deepest blue in light mode but is darker than primaryLight
// in dark mode — so there the brightest step takes the top instead.
const DARK_MODE_RAMPS: Partial<Record<HeatColor, [Color, Color, Color]>> = {
  primary: ['primaryLighter', 'primaryLight', 'primary'],
}

export type HeatGraphProps = React.HTMLAttributes<HTMLOrSVGElement> & {
  data: ITimeSeries
  rows: number
  days: number
  color: HeatColor
  width?: number
  height?: number
  max?: number
  onHover?: (value?: [Date, number]) => void
}

export const HeatGraph: React.FC<HeatGraphProps> = ({
  data,
  rows,
  days,
  color,
  width = 100,
  height = 18,
  max,
  onHover,
  ...props
}) => {
  const theme = useTheme()
  const grid = useMemo(() => heatmapGrid(data, rows, days), [data, rows, days])

  const scale = useMemo(() => {
    const stops = (theme.palette.mode === 'dark' && DARK_MODE_RAMPS[color]) || RAMPS[color]
    const ramp = stops.map(c => theme.palette[c].main)
    // The palette's lightest step is still saturated enough that a barely used
    // hour and a half used one read the same, so the ramp starts from a tint of
    // it mixed toward the surface — which also keeps it correct in dark mode.
    // Interpolating in RGB rather than HCL, which leaves the sRGB gamut on the
    // way out of white and clips back to a color brighter than the ramp itself.
    const lightest = d3.interpolateRgb(theme.palette.white.main, ramp[0])(0.3)
    // Fall back to the series' own peak when the type has no ceiling (event
    // counts), otherwise every cell would sit at the bottom of the ramp.
    const top = max ?? timeSeriesMax(data.data)
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
        column.cells.map((cell, y) =>
          cell === undefined ? null : (
            <rect
              key={`${column.key}-${y}`}
              className={onHover ? 'cell' : undefined}
              x={x * cellWidth}
              y={y * cellHeight}
              width={Math.max(cellWidth - 1, 1)}
              height={Math.max(cellHeight - 1, 1)}
              fill={cell.value > 0 ? scale(cell.value) : theme.palette.grayLighter.main}
              onMouseOver={onHover && (() => onHover([cell.date, cell.value]))}
              onMouseOut={onHover && (() => onHover(undefined))}
            />
          )
        )
      )}
    </Box>
  )
}
