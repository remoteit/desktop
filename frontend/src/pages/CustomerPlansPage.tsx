import React from 'react'
import { State } from '../store'
import { useParams } from 'react-router-dom'
import { Typography, Stack } from '@mui/material'
import { useSelector } from 'react-redux'
import { selectCustomer, selectOrganizationReseller } from '../selectors/organizations'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Avatar } from '../components/Avatar'
import { Plans } from '../components/Plans'

export const CustomerPlansPage: React.FC = () => {
  const { userID = '' } = useParams<{ userID: string }>()
  const reseller = useSelector(selectOrganizationReseller)
  const customer = useSelector((state: State) => selectCustomer(state, undefined, userID))
  const license = customer?.license

  if (!customer || !license) return null

  return (
    <Container
      gutterBottom
      integrated
      header={
        <Gutters>
          <Stack flexDirection="row" alignItems="center" justifyContent="space-between">
            <Typography
              variant="caption"
              textAlign="right"
              marginRight={-2}
              borderRight="1px solid"
              borderColor="grayLight.main"
              paddingRight={2}
            >
              Select a <br />
              plan for
            </Typography>
            <Typography variant="h1" flexGrow={1}>
              {customer?.email}
            </Typography>
            <Avatar email={customer?.email} />
          </Stack>
        </Gutters>
      }
    >
      {reseller && (
        <Plans accountId={userID} license={license} plan={license.plan} plans={reseller.plans} includeLicenseId />
      )}
    </Container>
  )
}
