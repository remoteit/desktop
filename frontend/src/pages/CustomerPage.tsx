import React from 'react'
import { Redirect } from 'react-router-dom'
import { State } from '../store'
import { Typography } from '@mui/material'
import { useSelector } from 'react-redux'
import { REGEX_LAST_PATH } from '../constants'
import { useParams, useLocation } from 'react-router-dom'
import { selectReseller, selectOrganization, selectOwner, selectLicensesWithLimits } from '../selectors/organizations'
import { LicensingSetting } from '../components/LicensingSetting'
import { DeleteButton } from '../buttons/DeleteButton'
import { Container } from '../components/Container'
import { Avatar } from '../components/Avatar'
import { Plans } from '../components/Plans'
import { Title } from '../components/Title'

export const CustomerPage: React.FC = () => {
  const location = useLocation()
  const { userID = '' } = useParams<{ userID: string }>()
  const customer = useSelector(selectReseller)?.customers.find(c => c.id === userID)
  const { licenses, limits } = useSelector((state: State) => {
    console.log('---------------------------------------------------- begin')
    console.log('SELECT LIMITS', customer?.id, customer?.license)
    return selectLicensesWithLimits(state, undefined, customer?.id)
  })

  console.log({ customer, licenses, limits })
  console.log('---------------------------------------------------- end')

  const owner = useSelector(selectOwner)
  const organization = useSelector(selectOrganization)

  if (!customer)
    return (
      <Redirect
        to={{
          pathname: location.pathname.replace(REGEX_LAST_PATH, ''),
          state: { isRedirect: true },
        }}
      />
    )

  return (
    <Container
      gutterBottom
      header={
        <Typography variant="h1" marginTop={1} gutterBottom>
          <Title>
            <Avatar email={customer?.email} marginRight={16} />
            {customer?.email}
          </Title>
          <DeleteButton onDelete={() => {}} />
          {/* @TODO replace with RemoveCustomer */}
        </Typography>
      }
    >
      <Typography variant="subtitle1">License</Typography>
      <LicensingSetting licenses={licenses} limits={limits} />
      <Typography variant="subtitle1">Plan</Typography>
      {/* <Plans /> */}
    </Container>
  )
}
