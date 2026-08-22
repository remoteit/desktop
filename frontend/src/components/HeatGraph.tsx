import React, { useMemo, useState } from 'react'
import { Box, useTheme } from '@mui/material'
import { heatmapGrid, timeSeriesFullScale, timeSeriesMax } from '../helpers/dateHelper'

// Cells are square, so one size gives both axes: the hour rows set the height
// and the day columns set the width.
export const HEATMAP_CELL = 7
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

// Constant, so it is not rebuilt and re-serialized through emotion on every
// pointer move.
const GRAPH_SX = {
  backgroundColor: 'white.main',
  '@keyframes heatGraphPulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.4 } },
  '& .loading': { animation: 'heatGraphPulse 1.6s ease-in-out infinite' },
}

export type HeatGraphProps = React.HTMLAttributes<HTMLOrSVGElement> & {
  cells: (HeatCell | undefined)[][]
  rows: number
  days: number
  loading?: boolean
  // Reports the cell under the pointer by position. The caller reads the value
  // out of the same `cells` it passed in, so the readout cannot drift from what
  // is drawn.
  onHover?: (cell?: [number, number]) => void
}

export type HeatCell = ITimeSeriesCell & { fill: string }

// The cells a heat map draws, owned by the view that also renders the readout
// so both read the same array — a copy of the hovered cell held elsewhere goes
// stale the moment the series is replaced.
//
// Two memos rather than one: bucketing a 744 point series is the expensive
// half and depends only on the data, while the fill depends on the palette. A
// device going online flips the color and must not re-fold the series.
export const useHeatCells = (
  data: ITimeSeries | undefined,
  rows: number,
  days: number,
  color: HeatColor,
  skip?: boolean
): (HeatCell | undefined)[][] => {
  const theme = useTheme()
  const grid = useMemo(() => (data && !skip ? heatmapGrid(data, rows, days) : []), [data, rows, days, skip])

  return useMemo(() => {
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
    const top = (data && timeSeriesFullScale(data.type, data.resolution)) ?? timeSeriesMax(data?.data ?? [])
    const scale = d3
      .scaleLinear<string>()
      .domain([0, top / 3, (top * 2) / 3, top])
      .range([lightest, ...ramp])
      .interpolate(d3.interpolateRgb)
      .clamp(true)
    return grid.map(column =>
      column.map(cell => cell && { ...cell, fill: cell.value > 0 ? scale(cell.value) : theme.palette.grayLighter.main })
    )
  }, [grid, data, color, theme])
}

export const HeatGraph: React.FC<HeatGraphProps> = ({ cells, rows, days, loading, onHover, ...props }) => {
  const theme = useTheme()
  const [hovered, setHovered] = useState<[number, number]>()

  // Sized from the span being drawn rather than from the cells that happen to
  // exist, so the loading grid is laid out at the size the real one will be and
  // the columns don't jump when the data lands.
  const width = days * HEATMAP_CELL
  const height = rows * HEATMAP_CELL
  const lines = useMemo(() => gridLines(days, rows), [days, rows])

  // One handler on the grid instead of one per cell, which also means the gaps
  // a DST-skipped hour leaves behave like any other empty cell rather than
  // holding the last reading open.
  const onMove = (event: React.MouseEvent<SVGElement>) => {
    if (!onHover) return
    // d3.pointer rather than subtracting getBoundingClientRect, so the mapping
    // survives a viewBox or a CSS transform on the svg.
    const [px, py] = d3.pointer(event)
    const x = Math.floor(px / HEATMAP_CELL)
    const y = Math.floor(py / HEATMAP_CELL)
    const cell = cells[x]?.[y]
    // Mousemove fires far faster than the pointer crosses cells, and every
    // re-render reconciles the whole grid — so only report a real change.
    if (cell ? hovered?.[0] === x && hovered?.[1] === y : !hovered) return
    setHovered(cell ? [x, y] : undefined)
    onHover(cell ? [x, y] : undefined)
  }

  const clear = () => {
    setHovered(undefined)
    onHover?.(undefined)
  }

  // Held across renders so a hover — which re-renders this component — does not
  // rebuild and re-diff up to 720 elements whose pixels did not change.
  const rects = useMemo(
    () =>
      loading
        ? null
        : cells.map((column, x) =>
            column.map(
              (cell, y) =>
                cell && (
                  <rect
                    key={`${x}-${y}`}
                    x={x * HEATMAP_CELL}
                    y={y * HEATMAP_CELL}
                    width={HEATMAP_CELL}
                    height={HEATMAP_CELL}
                    fill={cell.fill}
                  />
                )
            )
          ),
    [cells, loading]
  )

  return (
    <Box
      component="svg"
      width={width}
      height={height}
      sx={GRAPH_SX}
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
      {rects}
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
          x={hovered[0] * HEATMAP_CELL + 1}
          y={hovered[1] * HEATMAP_CELL + 1}
          width={HEATMAP_CELL - 2}
          height={HEATMAP_CELL - 2}
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
const gridLines = (columns: number, rows: number) => {
  const width = columns * HEATMAP_CELL
  const height = rows * HEATMAP_CELL
  let d = ''
  for (let x = 1; x < columns; x++) d += `M${x * HEATMAP_CELL} 0V${height}`
  for (let y = 1; y < rows; y++) d += `M0 ${y * HEATMAP_CELL}H${width}`
  return d
}
