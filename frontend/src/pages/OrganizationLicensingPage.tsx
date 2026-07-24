import React from 'react'
import { useTranslation } from 'react-i18next'
import { Redirect } from 'react-router-dom'
import { Typography } from '@mui/material'
import { selectLicensesWithLimits } from '../selectors/organizations'
import { LicensingSetting } from '../components/LicensingSetting'
import { useSelector } from 'react-redux'
import { Container } from '../components/Container'

export const OrganizationLicensingPage: React.FC = () => {
  const { t } = useTranslation()
  const { licenses, limits } = useSelector(selectLicensesWithLimits)

  if (!licenses.length) return <Redirect to={{ pathname: '/organization', state: { isRedirect: true } }} />

  return (
    <Container gutterBottom header={<Typography variant="h1">{t('organizationLicensingPage.title', 'License')}</Typography>}>
      <LicensingSetting licenses={licenses} limits={limits} />
    </Container>
  )
}
