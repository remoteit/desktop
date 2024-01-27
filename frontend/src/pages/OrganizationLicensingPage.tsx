import React from 'react'
import { Redirect } from 'react-router-dom'
import { Typography } from '@mui/material'
import { getLicenses } from '../models/plans'
import { State } from '../store'
import { LicensingSetting } from '../components/LicensingSetting'
import { selectActiveAccountId } from '../selectors/accounts'
import { useSelector } from 'react-redux'
import { Container } from '../components/Container'

export const OrganizationLicensingPage: React.FC = () => {
  const { licenses, limits } = useSelector((state: State) => getLicenses(state, selectActiveAccountId(state)))

  if (!licenses.length) return <Redirect to={{ pathname: '/organization', state: { isRedirect: true } }} />

  return (
    <Container gutterBottom header={<Typography variant="h1">License</Typography>}>
      <LicensingSetting licenses={licenses} limits={limits} />
    </Container>
  )
}
