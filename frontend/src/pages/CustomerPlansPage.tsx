import React from 'react'
import { State } from '../store'
import { useParams } from 'react-router-dom'
import { Typography, Stack } from '@mui/material'
import { useSelector } from 'react-redux'
import { selectCustomer, selectReseller } from '../selectors/organizations'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Avatar } from '../components/Avatar'
import { Plans } from '../components/Plans'

export const CustomerPlansPage: React.FC = () => {
  const { userID = '' } = useParams<{ userID: string }>()
  const reseller = useSelector(selectReseller)
  const customer = useSelector((state: State) => selectCustomer(state, undefined, userID))
  const license = customer?.license

  if (!customer || !license) return null

  return (
    <Container
      gutterBottom
      integrated
      header={
        <Gutters>
          <Stack flexDirection="row" justifyContent="space-between">
            <Typography variant="h2" marginTop={1}>
              Select a plan for {customer?.email}
            </Typography>
            <Avatar email={customer?.email} marginRight={16} />
          </Stack>
        </Gutters>
      }
    >
      {reseller && <Plans accountId={userID} license={license} plan={license.plan} plans={reseller.plans} />}
    </Container>
  )
}
