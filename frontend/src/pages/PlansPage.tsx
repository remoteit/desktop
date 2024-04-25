import React from 'react'
import { getUser } from '../selectors/state'
import { State, Dispatch } from '../store'
import { ENTERPRISE_PLAN_ID, RESELLER_PLAN_ID } from '../models/plans'
import { selectPlan, selectRemoteitPlans, selectRemoteitLicense } from '../selectors/organizations'
import { useSelector, useDispatch } from 'react-redux'
import { Typography, Divider } from '@mui/material'
import { LoadingMessage } from '../components/LoadingMessage'
import { PlanEnterprise } from '../components/PlanEnterprise'
import { PlanReseller } from '../components/PlanReseller'
import { PlanCustomer } from '../components/PlanCustomer'
import { DeleteButton } from '../buttons/DeleteButton'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'
import { Plans } from '../components/Plans'

export const PlansPage: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const { initialized } = useSelector((state: State) => state.plans)
  const license = useSelector((state: State) => selectRemoteitLicense(state, state.user.id))
  const plans = useSelector((state: State) => selectRemoteitPlans(state))
  const plan = useSelector((state: State) => selectPlan(state, state.user.id))
  const user = useSelector(getUser)

  const isReseller = license?.plan.id === RESELLER_PLAN_ID
  const isEnterprise = license?.plan.id === ENTERPRISE_PLAN_ID

  if (!initialized) return <LoadingMessage message="Loading plans..." />

  const removeReseller = async () => {
    await dispatch.user.leaveReseller()
  }

  return (
    <Container
      integrated
      gutterBottom
      bodyProps={{ verticalOverflow: true, gutterTop: true }}
      header={
        <Typography variant="h1">
          <Title>Subscriptions</Title>
          {user.reseller && (
            <DeleteButton
              title="Remove"
              warning={
                <>
                  <Notice severity="error" fullWidth gutterBottom>
                    This will sever your reseller relationship!
                  </Notice>
                  You are removing <b>”{user.reseller.name}”</b> as your reseller. This will remove your current plan
                  and return you to the free plan.
                </>
              }
              onDelete={removeReseller}
            />
          )}
        </Typography>
      }
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
