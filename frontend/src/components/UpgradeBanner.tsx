import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { selectPlan } from '../selectors/organizations'
import { PERSONAL_PLAN_ID } from '../models/plans'
import { useSelector } from 'react-redux'
import { ColorChip } from './ColorChip'
import { BillingUI } from './BillingUI'
import { Notice } from './Notice'
import { Box } from '@mui/material'

export const UpgradeBanner: React.FC = () => {
  const { t } = useTranslation()
  const plan = useSelector(selectPlan)
  if (plan?.id !== PERSONAL_PLAN_ID) return null
  return (
    <Notice gutterBottom>
      {t('upgradeBanner.accessPremium', 'Access premium features & support')}
      <Box marginTop={1.4}>
        <BillingUI>
          <Link to="/account/plans">
            <ColorChip
              size="small"
              variant="contained"
              color="primary"
              label={t('upgradeBanner.upgradePlan', 'Upgrade Plan')}
            />
          </Link>
        </BillingUI>
      </Box>
    </Notice>
  )
}
