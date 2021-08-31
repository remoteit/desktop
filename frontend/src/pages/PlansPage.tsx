import React, { useEffect } from 'react'
import { Invoices } from '../components/Invoices'
import { Container } from '../components/Container'
import { Typography } from '@material-ui/core'
import { PlanSettings } from '../components/PlanSettings'
import analyticsHelper from '../helpers/analyticsHelper'

export const PlansPage: React.FC = () => {
  useEffect(() => {
    analyticsHelper.page('PlansPage')
  }, [])

  return (
    <Container gutterBottom header={<Typography variant="h1">Plans</Typography>}>
      <PlanSettings />
      <Typography variant="subtitle1">Credit Cards</Typography>
      <Typography variant="subtitle1">Billing History</Typography>
      <Invoices />
    </Container>
  )
}
