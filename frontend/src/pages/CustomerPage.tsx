import React from 'react'
import { Redirect } from 'react-router-dom'
import { State } from '../store'
import { Typography } from '@mui/material'
import { useSelector } from 'react-redux'
import { REGEX_LAST_PATH } from '../constants'
import { useParams, useLocation } from 'react-router-dom'
import { selectOrganization, selectOwner, selectLicensesWithLimits } from '../selectors/organizations'
import { LicensingSetting } from '../components/LicensingSetting'
import { DeleteButton } from '../buttons/DeleteButton'
import { Container } from '../components/Container'
import { Avatar } from '../components/Avatar'
import { Plans } from '../components/Plans'
import { Title } from '../components/Title'

export const CustomerPage: React.FC = () => {
  const location = useLocation()
  const { userID = '' } = useParams<{ userID: string }>()

  const user: IUser = useSelector((state: State) => state.user) // @TODO use userID to get customer
  const { licenses, limits } = useSelector(selectLicensesWithLimits)

  console.log({ licenses, limits })

  const owner = useSelector(selectOwner)
  const organization = useSelector(selectOrganization)

  if (!user)
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
            <Avatar email={user?.email} marginRight={16} />
            {user?.email}
          </Title>
          <DeleteButton onDelete={() => {}} />
          {/* @TODO replace with RemoveCustomer */}
        </Typography>
      }
    >
      <LicensingSetting licenses={licenses} limits={limits} />
      <Typography variant="subtitle1">Plan</Typography>
      <Plans />
    </Container>
  )
}
