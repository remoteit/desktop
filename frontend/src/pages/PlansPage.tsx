import React from 'react'
import { State } from '../store'
import { getUser } from '../selectors/state'
import { ENTERPRISE_PLAN_ID } from '../models/plans'
import { selectPlan, selectRemoteitPlans, selectRemoteitLicense } from '../selectors/organizations'
import { Typography, Divider } from '@mui/material'
import { LoadingMessage } from '../components/LoadingMessage'
import { useSelector } from 'react-redux'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Plans } from '../components/Plans'

export const PlansPage: React.FC = () => {
  const { initialized } = useSelector((state: State) => state.plans)
  const user = useSelector(getUser)
  const license = useSelector(selectRemoteitLicense)
  const plans = useSelector(selectRemoteitPlans)
  const plan = useSelector(selectPlan)

  if (!initialized) return <LoadingMessage message="Loading plans..." />

  return (
    <Container
      integrated
      gutterBottom
      bodyProps={{ verticalOverflow: true, gutterTop: true }}
      header={<Typography variant="h1">Subscriptions</Typography>}
    >
      <Plans {...{ plans, accountId: user.id, plan, license, reseller: user.reseller }} showEnterprise />
      {!user.reseller && license?.plan.id !== ENTERPRISE_PLAN_ID && (
        <>
          <Divider variant="inset" />
          <Gutters>
            <Typography variant="caption">
              Pricing is represented and billed in US$ on most popular credit cards.
            </Typography>
          </Gutters>
        </>
      )}
    </Container>
  )
}
