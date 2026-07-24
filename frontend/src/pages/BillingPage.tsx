import React from 'react'
import { Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { CreditCard } from '../components/CreditCard'
import { Container } from '../components/Container'
import { Invoices } from '../components/Invoices'
import { Title } from '../components/Title'

export const BillingPage: React.FC = () => {
  const { t } = useTranslation()
  return (
    <Container
      gutterBottom
      bodyProps={{ verticalOverflow: true }}
      header={
        <Typography variant="h1">
          <Title>{t('billingPage.title', 'Billing')}</Title>
        </Typography>
      }
    >
      <CreditCard />
      <Invoices />
    </Container>
  )
}
