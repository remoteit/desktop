import React, { useMemo, useState } from 'react'
import { Box, useTheme } from '@mui/material'
import { heatmapGrid, timeSeriesFullScale, timeSeriesMax } from '../helpers/dateHelper'

// Cells are square, so one size gives both axes: the hour rows set the height
// and the day columns set the width.
export const HEATMAP_CELL = 7
import * as d3 from 'd3'

export type HeatColor = 'primary' | 'success' | 'gray'

// Light to dark stops, so a cell's depth reads as "more of this". Each starts
// one step in from the palette's background tints — those are surface colors,
// and a cell holding real data must not be mistaken for an empty one.
const RAMPS: Record<HeatColor, [Color, Color, Color]> = {
  primary: ['primaryLight', 'primary', 'primaryDark'],
  success: ['successLight', 'success', 'successDark'],
  gray: ['gray', 'grayDarker', 'grayDarkest'],
}

// success and gray swap their steps between modes, so those ramps already point
// least-to-most in both. primary does not, so dark mode reorders it.
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
  // By position: the caller reads the value out of the same `cells` it passed
  // in, so the readout cannot drift from what is drawn.
  onHover?: (cell?: [number, number]) => void
}

export type HeatCell = ITimeSeriesCell & { fill: string }

// Owned by the view that also renders the readout, so both read the same array
// and the readout cannot go stale when the series is replaced. Two memos: the
// fold depends only on the data, the fill only on the palette, and a device
// going online flips the color without re-folding 744 points.
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
    // The palette's lightest step is saturated enough that a barely used hour and
    // a half used one read alike, so the ramp starts from a tint of it — but not
    // so pale that the faintest cell matches an empty one, or a brief connection
    // would look like none. In RGB rather than HCL, which leaves the sRGB gamut
    // on the way out of white and clips back to a color brighter than the ramp.
    const lightest = d3.interpolateRgb(theme.palette.white.main, ramp[0])(0.6)
    // Falls back to the series' own peak when the type has no ceiling.
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

  // From the span being drawn, not the cells that exist, so the loading grid is
  // laid out at the size the real one will be.
  const width = days * HEATMAP_CELL
  const height = rows * HEATMAP_CELL
  const lines = useMemo(() => gridLines(days, rows), [days, rows])

  // One handler on the grid rather than one per cell, so a DST-skipped hour's
  // gap behaves like any other empty cell instead of holding the last reading.
  const onMove = (event: React.MouseEvent<SVGElement>) => {
    if (!onHover) return
    // d3.pointer rather than subtracting getBoundingClientRect, so the mapping
    // survives a viewBox or a CSS transform on the svg.
    const [px, py] = d3.pointer(event)
    const x = Math.floor(px / HEATMAP_CELL)
    const y = Math.floor(py / HEATMAP_CELL)
    const cell = cells[x]?.[y]
    // Mousemove fires far faster than the pointer crosses cells.
    if (cell ? hovered?.[0] === x && hovered?.[1] === y : !hovered) return
    setHovered(cell ? [x, y] : undefined)
    onHover(cell ? [x, y] : undefined)
  }

  const clear = () => {
    setHovered(undefined)
    onHover?.(undefined)
  }

  // Held across renders so a hover does not re-diff 720 unchanged elements.
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
      {/* One rect — the lines drawn over it supply the empty grid. */}
      {loading && (
        <rect className="loading" x={0} y={0} width={width} height={height} fill={theme.palette.grayLight.main} />
      )}
      {rects}
      {/* Drawn once on top rather than as a stroke per cell: neighbours both
          stroke their shared edge, so a semi-transparent one would double up. */}
      <path d={lines} fill="none" stroke={theme.palette.white.main} strokeOpacity={0.2} strokeWidth={1} />
      {/* After the grid, not a :hover stroke: later cells would paint over the
          outer half and leave only the top and left edges. Inset to fit. */}
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

// One path for every cell boundary, skipping the outer edges.
const gridLines = (columns: number, rows: number) => {
  const width = columns * HEATMAP_CELL
  const height = rows * HEATMAP_CELL
  let d = ''
  for (let x = 1; x < columns; x++) d += `M${x * HEATMAP_CELL} 0V${height}`
  for (let y = 1; y < rows; y++) d += `M0 ${y * HEATMAP_CELL}H${width}`
  return d
}
