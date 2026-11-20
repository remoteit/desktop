import React from 'react'
import { useTranslation } from 'react-i18next'
import { Redirect } from 'react-router-dom'
import { Typography } from '@mui/material'
import { selectLicensesWithLimits, selectPlan, selectRemoteitLicense, selectRemoteitPlans } from '../selectors/organizations'
import { LicensingSetting } from '../components/LicensingSetting'
import { useSelector } from 'react-redux'
import { Container } from '../components/Container'
import { FileStorageLimit } from '../components/FileStorageUsage'
import { TransferUsage } from '../components/TransferUsage'
import { selectActiveAccountId, selectMembership } from '../selectors/accounts'
import { Plans } from '../components/Plans'
import { BillingUI } from '../components/BillingUI'
import { CreditCard } from '../components/CreditCard'

export const OrganizationLicensingPage: React.FC = () => {
  const { t } = useTranslation()
  const accountId = useSelector(selectActiveAccountId)
  const standalone = useSelector(selectMembership).standalone
  const plan = useSelector(selectPlan)
  const license = useSelector(selectRemoteitLicense)
  const plans = useSelector(selectRemoteitPlans)
  const { licenses, limits } = useSelector(selectLicensesWithLimits)

  if (!licenses.length) return <Redirect to={{ pathname: '/organization', state: { isRedirect: true } }} />

  return (
    <Container gutterBottom header={<Typography variant="h1">{t('organizationLicensingPage.title', 'License')}</Typography>}>
      <LicensingSetting licenses={licenses} limits={limits} />
      <FileStorageLimit accountId={accountId} />
      <TransferUsage accountId={accountId} />
      {standalone && license && (
        <BillingUI>
          <CreditCard accountId={accountId} />
          <Plans license={license} plan={plan} plans={plans} includeLicenseId />
        </BillingUI>
      )}
    </Container>
  )
}
