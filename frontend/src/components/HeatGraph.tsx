import React, { useMemo, useState } from 'react'
import { Box, useTheme } from '@mui/material'
import { heatmapGrid, timeSeriesMax } from '../helpers/dateHelper'
import * as d3 from 'd3'

export type HeatColor = 'primary' | 'success' | 'gray'

// Light to dark stops for each color the graphs use, so a cell's depth reads as
// "more of this" rather than as a different thing.
// Each ramp starts one step in from the palette's background tints — those are
// surface colors, and a cell holding real data should never be mistaken for an
// empty one.
const RAMPS: Record<HeatColor, [Color, Color, Color]> = {
  primary: ['primaryLight', 'primary', 'primaryDark'],
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
  primary: ['primaryDark', 'primaryLight', 'primary'],
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
  const [hovered, setHovered] = useState<[number, number]>()
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
      sx={{ backgroundColor: theme.palette.white.main }}
      // Clearing on the way out of the grid rather than out of each cell, so
      // crossing between cells never blanks the readout.
      onMouseLeave={
        onHover &&
        (() => {
          setHovered(undefined)
          onHover(undefined)
        })
      }
      {...props}
    >
      {grid.columns.map((column, x) =>
        column.cells.map((cell, y) =>
          cell === undefined ? null : (
            <rect
              key={`${column.key}-${y}`}
              x={x * cellWidth}
              y={y * cellHeight}
              width={cellWidth}
              height={cellHeight}
              fill={cell.value > 0 ? scale(cell.value) : theme.palette.grayLighter.main}
              onMouseOver={
                onHover &&
                (() => {
                  setHovered([x, y])
                  onHover([cell.date, cell.value])
                })
              }
            />
          )
        )
      )}
      {/* Cells butt up against each other so the pointer is always over one of
          them, and the lines between them are drawn once on top rather than as
          a stroke on each cell — two neighbours both stroke their shared edge,
          so a semi-transparent one would come out heavier on one side than the
          other. */}
      <path
        d={gridLines(grid.columns.length, rows, cellWidth, cellHeight, width, height)}
        fill="none"
        stroke={theme.palette.white.main}
        strokeOpacity={0.5}
        strokeWidth={1}
        pointerEvents="none"
      />
      {/* Drawn after the grid rather than as a :hover stroke on the cell —
          cells are painted left to right and top to bottom, so the neighbours
          below and to the right would cover the outer half of the outline and
          leave only its top and left edges showing. Inset by half its width so
          all four edges land inside the cell. */}
      {hovered && (
        <rect
          x={hovered[0] * cellWidth + 1}
          y={hovered[1] * cellHeight + 1}
          width={Math.max(cellWidth - 2, 1)}
          height={Math.max(cellHeight - 2, 1)}
          fill="none"
          stroke={theme.palette.primary.main}
          strokeWidth={2}
          pointerEvents="none"
        />
      )}
    </Box>
  )
}

// The lines between cells, as one path — a vertical at every column boundary
// and a horizontal at every row boundary, skipping the outer edges.
const gridLines = (
  columns: number,
  rows: number,
  cellWidth: number,
  cellHeight: number,
  width: number,
  height: number
) => {
  let d = ''
  for (let x = 1; x < columns; x++) d += `M${x * cellWidth} 0V${height}`
  for (let y = 1; y < rows; y++) d += `M0 ${y * cellHeight}H${width}`
  return d
}
