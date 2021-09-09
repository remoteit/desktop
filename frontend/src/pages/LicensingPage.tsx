import React, { useEffect } from 'react'
import { Typography } from '@material-ui/core'
import { LicensingSetting } from '../components/LicensingSetting'
import { CreditCard } from '../components/CreditCard'
import { Container } from '../components/Container'
import { Invoices } from '../components/Invoices'
import { Title } from '../components/Title'
import analyticsHelper from '../helpers/analyticsHelper'

export const LicensingPage: React.FC = () => {
  useEffect(() => {
    analyticsHelper.page('LicensingPage')
  }, [])

  return (
    <Container
      gutterBottom
      header={
        <Typography variant="h1">
          <Title>Billing</Title>
        </Typography>
      }
    >
      <LicensingSetting />
      <CreditCard />
      <Invoices />
    </Container>
  )
}
