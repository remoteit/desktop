import React, { useEffect, useMemo, useState } from 'react'
import { Box, useTheme } from '@mui/material'
import { heatmapGrid, timeSeriesMax } from '../helpers/dateHelper'
import * as d3 from 'd3'

export type HeatColor = 'primary' | 'success' | 'gray'

// Light to dark stops for each color the graphs use, so a cell's depth reads as
// "more of this" rather than as a different thing. Each starts one step in from
// the palette's background tints — those are surface colors, and a cell holding
// real data should never be mistaken for an empty one.
const RAMPS: Record<HeatColor, [Color, Color, Color]> = {
  primary: ['primaryLight', 'primary', 'primaryDark'],
  success: ['successLight', 'success', 'successDark'],
  // Ends at the body text color, not at a disabled gray — an offline device's
  // history is still history.
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
  width: number
  height: number
  loading?: boolean
  max?: number
  // The fill goes up with the value so the readout can show a large swatch of
  // the exact color the cell is drawn in.
  onHover?: (value?: [Date, number, string]) => void
}

export const HeatGraph: React.FC<HeatGraphProps> = ({
  data,
  rows,
  days,
  color,
  width,
  height,
  loading,
  max,
  onHover,
  ...props
}) => {
  const theme = useTheme()
  const [hovered, setHovered] = useState<[number, number]>()

  // Colors resolve once per series rather than once per pointer move — hovering
  // re-renders this component, and there can be 720 cells to paint. While
  // loading none of them are drawn, so none are built either.
  const cells = useMemo(() => {
    if (loading) return []
    const ramp = ((theme.palette.mode === 'dark' && DARK_MODE_RAMPS[color]) || RAMPS[color]).map(
      c => theme.palette[c].main
    )
    // The palette's lightest step is still saturated enough that a barely used
    // hour and a half used one read the same, so the ramp starts from a tint of
    // it mixed toward the surface — which also keeps it correct in dark mode.
    // Interpolating in RGB rather than HCL, which leaves the sRGB gamut on the
    // way out of white and clips back to a color brighter than the ramp itself.
    const lightest = d3.interpolateRgb(theme.palette.white.main, ramp[0])(0.3)
    // Fall back to the series' own peak when the type has no ceiling (event
    // counts), otherwise every cell would sit at the bottom of the ramp.
    const top = max ?? timeSeriesMax(data.data)
    const scale = d3
      .scaleLinear<string>()
      .domain([0, top / 3, (top * 2) / 3, top])
      .range([lightest, ...ramp])
      .interpolate(d3.interpolateRgb)
      .clamp(true)
    return heatmapGrid(data, rows, days).columns.map(column =>
      column.cells.map(
        cell => cell && { ...cell, fill: cell.value > 0 ? scale(cell.value) : theme.palette.grayLighter.main }
      )
    )
  }, [data, rows, days, color, max, theme, loading])

  // Sized from the span being drawn rather than from the cells that happen to
  // exist, so the loading grid is laid out at the size the real one will be and
  // the columns don't jump when the data lands. heatmapGrid pads to match.
  const cellWidth = width / Math.max(days, 1)
  const cellHeight = height / rows

  const lines = useMemo(
    () => gridLines(days, rows, cellWidth, cellHeight, width, height),
    [days, rows, cellWidth, cellHeight, width, height]
  )

  // One handler on the grid instead of one per cell, which also means the gaps
  // a DST-skipped hour leaves behave like any other empty cell rather than
  // holding the last reading open.
  const onMove = (event: React.MouseEvent<SVGElement>) => {
    if (!onHover) return
    const box = event.currentTarget.getBoundingClientRect()
    const x = Math.floor((event.clientX - box.left) / cellWidth)
    const y = Math.floor((event.clientY - box.top) / cellHeight)
    const cell = cells[x]?.[y]
    // Mousemove fires far faster than the pointer crosses cells, and every
    // re-render reconciles the whole grid — so only report a real change.
    if (cell ? hovered?.[0] === x && hovered?.[1] === y : !hovered) return
    setHovered(cell ? [x, y] : undefined)
    onHover(cell ? [cell.date, cell.value, cell.fill] : undefined)
  }

  const clear = () => {
    setHovered(undefined)
    onHover?.(undefined)
  }

  // The readout is captured from the cell under the pointer, so rebuilding the
  // cells leaves it describing a series that is no longer drawn. Waiting for the
  // next move would not fix it — the pointer may be still, and moving inside the
  // same cell is exactly what onMove skips — so it is re-read here instead, and
  // dropped when the grid it pointed into has gone.
  useEffect(() => {
    if (!hovered || !onHover) return
    const cell = cells[hovered[0]]?.[hovered[1]]
    if (cell) onHover([cell.date, cell.value, cell.fill])
    else clear()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cells])

  return (
    <Box
      component="svg"
      width={width}
      height={height}
      sx={{
        backgroundColor: theme.palette.white.main,
        '@keyframes heatGraphPulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.4 } },
        '& .loading': { animation: 'heatGraphPulse 1.6s ease-in-out infinite' },
      }}
      onMouseMove={onHover && onMove}
      onMouseLeave={onHover && clear}
      {...props}
    >
      {/* One rect rather than a grid of them — the lines drawn over it give the
          same grid of empty cells, at whatever size the real one will be, so
          nothing moves when the data lands. */}
      {loading && (
        <rect className="loading" x={0} y={0} width={width} height={height} fill={theme.palette.grayLight.main} />
      )}
      {!loading &&
        cells.map((column, x) =>
          column.map(
            (cell, y) =>
              cell && (
                <rect
                  key={`${x}-${y}`}
                  x={x * cellWidth}
                  y={y * cellHeight}
                  width={cellWidth}
                  height={cellHeight}
                  fill={cell.fill}
                />
              )
          )
        )}
      {/* Cells butt up against each other so the pointer is always over one of
          them, and the lines between them are drawn once on top rather than as
          a stroke on each cell — two neighbours both stroke their shared edge,
          so a semi-transparent one would come out heavier on one side than the
          other. */}
      <path d={lines} fill="none" stroke={theme.palette.white.main} strokeOpacity={0.2} strokeWidth={1} />
      {/* Drawn after the grid rather than as a :hover stroke on the cell —
          cells are painted left to right and top to bottom, so the neighbours
          below and to the right would cover the outer half of the outline and
          leave only its top and left edges showing. Inset by half its width so
          all four edges land inside the cell. */}
      {!loading && hovered && (
        <rect
          x={hovered[0] * cellWidth + 1}
          y={hovered[1] * cellHeight + 1}
          width={Math.max(cellWidth - 2, 1)}
          height={Math.max(cellHeight - 2, 1)}
          fill="none"
          stroke={theme.palette.primary.main}
          strokeWidth={2}
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
