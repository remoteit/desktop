import React from 'react'
import { PlanCard } from './PlanCard'
import { PlanGutters } from './PlanGutters'
import { ResellerLogo } from '../components/ResellerLogo'
import { Typography } from '@mui/material'

type Props = { customer: IResellerRef }

export const PlanCustomer: React.FC<Props> = ({ customer }) => {
  return (
    <PlanGutters>
      <PlanCard
        wide
        selected
        name="Partner Support"
        description="Dedicated support and services plan"
        caption={
          <>
            <ResellerLogo reseller={customer} />
            <Typography variant="h2" gutterBottom>
              <b>{customer.name}</b>
            </Typography>
            Experience tailored services and dedicated support. <br />
            For help and inquiries, please reach out to {customer.email}.
          </>
        }
        button="Contact"
        onSelect={() => (window.location.href = encodeURI(`mailto:${customer.email}?subject=Remote.It Plan`))}
      />
    </PlanGutters>
  )
}
