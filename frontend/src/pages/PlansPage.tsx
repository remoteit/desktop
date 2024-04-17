import React from 'react'
import { State } from '../store'
import { getUser } from '../selectors/state'
import { ENTERPRISE_PLAN_ID, RESELLER_PLAN_ID } from '../models/plans'
import { selectPlan, selectRemoteitPlans, selectRemoteitLicense } from '../selectors/organizations'
import { Typography, Divider } from '@mui/material'
import { LoadingMessage } from '../components/LoadingMessage'
import { PlanEnterprise } from '../components/PlanEnterprise'
import { PlanReseller } from '../components/PlanReseller'
import { PlanCustomer } from '../components/PlanCustomer'
import { useSelector } from 'react-redux'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Plans } from '../components/Plans'

export const PlansPage: React.FC = () => {
  const { initialized } = useSelector((state: State) => state.plans)
  const user = useSelector(getUser)
  const license = useSelector((state: State) => selectRemoteitLicense(state, state.user.id))
  const plans = useSelector((state: State) => selectRemoteitPlans(state))
  const plan = useSelector((state: State) => selectPlan(state, state.user.id))

  const isReseller = license?.plan.id === RESELLER_PLAN_ID
  const isEnterprise = license?.plan.id === ENTERPRISE_PLAN_ID

  if (!initialized) return <LoadingMessage message="Loading plans..." />

  return (
    <Container
      integrated
      gutterBottom
      bodyProps={{ verticalOverflow: true, gutterTop: true }}
      header={<Typography variant="h1">Subscriptions</Typography>}
    >
      {user.reseller ? (
        <PlanCustomer customer={user.reseller} />
      ) : isReseller ? (
        <PlanReseller license={license} />
      ) : (
        <>
          {!isEnterprise && <Plans {...{ plans, accountId: user.id, plan, license }} />}
          <PlanEnterprise license={license} />
          {!isEnterprise && (
            <>
              <Divider variant="inset" />
              <Gutters>
                <Typography variant="caption">
                  Pricing is represented and billed in US$ on most popular credit cards.
                </Typography>
              </Gutters>
            </>
          )}
        </>
      )}
    </Container>
  )
}
