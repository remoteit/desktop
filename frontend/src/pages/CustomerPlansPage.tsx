import React from 'react'
import { State } from '../store'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Typography, Stack, List } from '@mui/material'
import { selectCustomer, selectOrganizationReseller } from '../selectors/organizations'
import { ListItemBack } from '../components/ListItemBack'
import { Container } from '../components/Container'
import { MobileUI } from '../components/MobileUI'
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
        <>
          <Stack
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
            marginRight={4}
            marginBottom={2}
          >
            <Typography variant="h1" flexGrow={1} flexDirection="column">
              <Typography variant="caption">Select a plan for</Typography>
              {customer?.email}
            </Typography>
            <Avatar email={customer?.email} />
          </Stack>
          {/* <MobileUI hide>
            <List sx={{ paddingTop: 0 }}>
              <ListItemBack to={`/organization/customer/${customer?.id}`} disableGutters={false} />
            </List>
          </MobileUI> */}
        </>
      }
    >
      {reseller && <Plans license={license} plan={license.plan} plans={reseller.plans} includeLicenseId />}
    </Container>
  )
}
