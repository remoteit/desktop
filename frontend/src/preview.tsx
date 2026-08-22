import React from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, CssBaseline, Typography, Stack } from '@mui/material'
import { getTheme } from './styling/theme'
import { TimeSeriesDetail, TimeSeries } from './components/TimeSeries'
import { BarGraph } from './components/BarGraph'

const makeSeries = (days: number): ITimeSeries => {
  const time: Date[] = []
  const data: number[] = []
  const now = new Date()
  for (let i = (days + 1) * 24 - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setMinutes(0, 0, 0)
    d.setHours(d.getHours() - i)
    time.push(d)
    const h = d.getHours()
    data.push(h >= 1 && h < 4 ? 3600 : h === 4 ? 1800 : 0)
  }
  return { type: 'ONLINE_DURATION', resolution: 'HOUR', style: 'heatmap', days, start: time[0], end: time[time.length - 1], time, data }
}

const opts = (days: number, style: ITimeSeriesStyle): ITimeSeriesOptions => ({
  type: 'ONLINE_DURATION', resolution: style === 'heatmap' ? 'HOUR' : 'DAY', length: days, style,
})

const Probe: React.FC = () => {
  const [v, setV] = React.useState<[Date, number]>()
  const series = React.useMemo(() => makeSeries(30), [])
  return (
    <Stack>
      <Typography variant="subtitle2">isolated BarGraph probe</Typography>
      <BarGraph data={series} color="success" height={40} width={200} onHover={setV} />
      <Typography variant="caption" id="probe-out">
        {v ? `PROBE FIRED ${v[0].toLocaleString()} = ${v[1]}` : 'PROBE IDLE'}
      </Typography>
    </Stack>
  )
}

createRoot(document.getElementById('root')!).render(
  <ThemeProvider theme={getTheme(false)}>
    <CssBaseline />
    <Stack padding={4} spacing={4}>
      <Stack>
        <Typography variant="subtitle2">heat map · 30 days</Typography>
        <TimeSeriesDetail timeSeries={makeSeries(30)} online options={opts(30, 'heatmap')} />
      </Stack>
      <Stack>
        <Typography variant="subtitle2">bars (same series, folded)</Typography>
        <TimeSeriesDetail timeSeries={makeSeries(30)} online options={opts(30, 'bar')} />
      </Stack>
      <Stack>
        <Typography variant="subtitle2">loading</Typography>
        <TimeSeriesDetail timeSeries={{ ...makeSeries(30), resolution: 'DAY' }} online options={opts(30, 'heatmap')} />
      </Stack>
      <Stack>
        <Typography variant="subtitle2">list strip</Typography>
        <TimeSeries timeSeries={makeSeries(30)} online />
      </Stack>
      <Probe />
    </Stack>
  </ThemeProvider>
)
