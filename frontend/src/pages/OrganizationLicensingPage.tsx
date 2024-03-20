import React from 'react'
import { Redirect } from 'react-router-dom'
import { Typography } from '@mui/material'
import { selectLicensesWithLimits } from '../selectors/organizations'
import { LicensingSetting } from '../components/LicensingSetting'
import { useSelector } from 'react-redux'
import { Container } from '../components/Container'

export const OrganizationLicensingPage: React.FC = () => {
  const { licenses, limits } = useSelector(selectLicensesWithLimits)

  if (!licenses.length) return <Redirect to={{ pathname: '/organization', state: { isRedirect: true } }} />

  return (
    <Container gutterBottom header={<Typography variant="h1">License</Typography>}>
      <LicensingSetting licenses={licenses} limits={limits} />
    </Container>
  )
}
