import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Dispatch, ApplicationState } from '../../store'
import { Typography, Tooltip, IconButton } from '@material-ui/core'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { Container } from '../../components/Container'
import { Columns } from '../../components/Columns'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import { RemoteSummaryBox } from '../../components/ReportSummaryBox'
import analyticsHelper from '../../helpers/analyticsHelper'
import { LoadingScreen } from '@remote.it/components'

export const ReportsPage: React.FC = () => {
  const { fetching, totalDevices } = useSelector((state: ApplicationState) => {
    return {
      fetchingMore: state.analytics.fetchingMore,
      fetching: state.analytics.fetching,
      devices: state.analytics.devices,
      totalDevices: state.analytics.totalDevices,
      totalConnections: state.analytics.totalConnections,
      connections: state.analytics.connections,
    }
  })
  const dispatch = useDispatch<Dispatch>()
  const { fetchAnalytics } = dispatch.analytics
  useEffect(() => {
    analyticsHelper.page('ReportPage')
    fetchAnalytics()
  }, [])

  return (
    <Container
      header={
        <>
          <Breadcrumbs />
          <Typography variant="h1">
            <Icon name="stream" size="lg" />
            <Title>Your Account Summary</Title>
          </Typography>
        </>
      }
    >
      {fetching ? (
        <LoadingScreen />
      ) : (
        <Columns count={2} inset>
          <RemoteSummaryBox label="Devices created" count={totalDevices} /> Here
        </Columns>
      )}
    </Container>
  )
}
