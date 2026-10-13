import React from 'react'
import { useTranslation } from 'react-i18next'
import { Redirect } from 'react-router-dom'
import { Typography } from '@mui/material'
import { selectLicensesWithLimits } from '../selectors/organizations'
import { LicensingSetting } from '../components/LicensingSetting'
import { useSelector } from 'react-redux'
import { Container } from '../components/Container'
import { FileStorageLimit } from '../components/FileStorageUsage'
import { selectActiveAccountId } from '../selectors/accounts'

export const OrganizationLicensingPage: React.FC = () => {
  const { t } = useTranslation()
  const accountId = useSelector(selectActiveAccountId)
  const { licenses, limits } = useSelector(selectLicensesWithLimits)

  if (!licenses.length) return <Redirect to={{ pathname: '/organization', state: { isRedirect: true } }} />

  return (
    <Container gutterBottom header={<Typography variant="h1">{t('organizationLicensingPage.title', 'License')}</Typography>}>
      <LicensingSetting licenses={licenses} limits={limits} />
      <FileStorageLimit accountId={accountId} />
    </Container>
  )
}
