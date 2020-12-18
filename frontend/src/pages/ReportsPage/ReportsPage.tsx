import React, { useEffect, useState, useRef, useLayoutEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Dispatch, ApplicationState } from '../../store'
import { Typography, Divider, Box } from '@material-ui/core'
import { colors, spacing } from '../../styling'
import { makeStyles } from '@material-ui/core/styles'
import { Container } from '../../components/Container'
import { Title } from '../../components/Title'
import { ReportSummaryBox } from '../../components/ReportSummaryBox'
import { ReportTimeSeriesVis } from '../../components/ReportTimeSeriesVis'
import analyticsHelper from '../../helpers/analyticsHelper'
import { format } from 'date-fns'

import { LoadingScreen } from '@remote.it/components'

export const ReportsPage: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const css = useStyles()
  const { fetchAnalytics } = dispatch.analytics
  const {
    fetching,
    totalDevices,
    devices,
    lastMonthDeviceCount,
    lastMonthConnectionCount,
    startDate,
    deviceTimeseries,
    connectionTimeseries,
  } = useSelector((state: ApplicationState) => {
    return {
      fetching: state.analytics.fetching,
      startDate: state.analytics.startDate,
      devices: state.analytics.devices,
      totalDevices: state.analytics.totalDevices,
      lastMonthDeviceCount: state.analytics.lastMonthDeviceCount,
      lastMonthConnectionCount: state.analytics.lastMonthConnectionCount,
      deviceTimeseries: state.analytics.deviceTimeseries,
      connectionTimeseries: state.analytics.connectionTimeseries,
    }
  })
  const targetRef = useRef<HTMLDivElement>(null)
  const [columnWidth, setColumnWidth] = useState(0)

  const div_dimensions = () => {
    if (targetRef.current) {
      setColumnWidth(targetRef.current.offsetWidth)
    }
  }
  useEffect(() => {
    analyticsHelper.page('ReportPage')
    if (devices.length == 0 || devices.length < totalDevices) {
      fetchAnalytics()
    }
  }, [])
  useLayoutEffect(() => {
    div_dimensions()
  }, [])

  return (
    <Container
      header={
        <Box className={css.container}>
          <Typography variant="h2" className={css.header}>
            <Title>{format(startDate, 'MMMM yyyy')} Account Summary</Title>
          </Typography>
        </Box>
      }
    >
      {fetching ? (
        <LoadingScreen />
      ) : (
        <>
          <Box display="flex" className={css.container}>
            <Typography className={css.header} variant="h4">
              <Title>Activity for the month</Title>
            </Typography>
          </Box>
          <Box display="flex" className={css.container}>
            <Box flexGrow={1} className={css.columnContainer}>
              <div ref={targetRef} className={css.column1}>
                <ReportSummaryBox
                  label="Devices created"
                  count={lastMonthDeviceCount}
                  total={totalDevices}
                  icon="hdd"
                  iconTitle="Devices"
                />
                <br />
                <ReportTimeSeriesVis
                  title="Vis Devices"
                  tooltipLabel="devices"
                  timeseriesData={deviceTimeseries}
                  width={columnWidth}
                  height={300}
                />
              </div>
            </Box>
            <Box flexGrow={1} className={css.columnContainer}>
              <div className={css.column2}>
                <ReportSummaryBox
                  label="Connections"
                  count={lastMonthConnectionCount}
                  icon="hdd"
                  iconTitle="Connections"
                />
                <br />
              </div>
            </Box>
          </Box>
          <br />
          <Box display="flex" className={css.container}>
            this is where the device stability will be displayed
          </Box>
        </>
      )}
    </Container>
  )
}
const useStyles = makeStyles({
  reportSummaryBox: {
    color: colors.white,
    backgroundColor: colors.primary,
    width: '100%',
  },
  container: {
    width: '100%',
    padding: `0px  ${spacing.md}px`,
  },
  columnContainer: {
    width: '50%',
  },
  column1: {
    width: '100%',
    padding: `0px ${spacing.sm}px 0px 0px`,
  },
  column2: {
    width: '100%',
    padding: `0px 0px 0px ${spacing.sm}px`,
  },
  header: {
    margin: `${spacing.sm}px 0px`,
  },
})
