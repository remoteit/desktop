import React from 'react'
import { useTranslation } from 'react-i18next'
import { Dispatch, State } from '../store'
import { ListItem, Button, Tooltip, IconButton } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { PERSONAL_PLAN_ID } from '../models/plans'
import { LicensingTitle } from './LicensingTitle'
import { Timestamp } from './Timestamp'
import { BillingUI } from './BillingUI'
import { Notice } from './Notice'
import { Link } from './Link'
import { Icon } from './Icon'

type Props = {
  noticeType: string
  license: ILicense | null
  serviceLimit?: ILimit
  fullWidth?: boolean
}

export const LicensingNoticeDisplay: React.FC<Props> = ({ noticeType, license, serviceLimit, fullWidth }) => {
  const { t } = useTranslation()
  const informed = useSelector((state: State) => state.plans.informed)
  const { plans } = useDispatch<Dispatch>()

  if (informed) return null

  const onClose = () => plans.set({ informed: true })

  let notice: React.ReactNode | null = null
  const description = license?.plan.description
  const productName = license?.plan.product.name
  const title = t('licensingNoticeDisplay.planTitle', {
    description,
    productName,
    defaultValue: 'Your {{description}} plan of {{productName}}',
  })

  const UpgradeButton = (
    <>
      <BillingUI>
        <Link to="/account/plans">
          <Button color="primary" variant="contained" size="small">
            {t('licensingNoticeDisplay.upgrade', 'Upgrade')}
          </Button>
        </Link>
      </BillingUI>
      <Tooltip title={t('licensingNoticeDisplay.close', 'Close')}>
        <IconButton onClick={onClose}>
          <Icon name="times" size="md" color="primary" />
        </IconButton>
      </Tooltip>
    </>
  )

  // 'ACTIVE' | 'CANCELED' | 'INCOMPLETE' | 'INCOMPLETE_EXPIRED' | 'PAST_DUE' | 'TRIALING' | 'UNPAID'
  switch (noticeType) {
    case 'EXPIRED':
      notice = (
        <Notice severity="warning" button={UpgradeButton}>
          {t('licensingNoticeDisplay.expiredTitle', {
            description,
            productName,
            defaultValue: 'Your {{description}} plan of {{productName}} has expired.',
          })}
          <em>
            {t('licensingNoticeDisplay.upgradeLicense', 'Please upgrade your license.')}{' '}
            <BillingUI>
              <Link to="/account/plans">{t('licensingNoticeDisplay.learnMore', 'Learn more.')}</Link>
            </BillingUI>
          </em>
        </Notice>
      )
      break
    case 'PAST_DUE':
      notice = (
        <Notice severity="error">
          {t('licensingNoticeDisplay.pastDueTitle', {
            description,
            productName,
            defaultValue: 'Your {{description}} plan of {{productName}} is past due.',
          })}
          <em>
            {t('licensingNoticeDisplay.updatePaymentMethod', 'Please update your payment method.')}{' '}
            <BillingUI>
              <Link to="/account/plans">{t('licensingNoticeDisplay.learnMore', 'Learn more.')}</Link>
            </BillingUI>
          </em>
        </Notice>
      )
      break
    case 'INCOMPLETE_EXPIRED':
    case 'INCOMPLETE':
      notice = (
        <Notice severity="warning">
          {t('licensingNoticeDisplay.incompleteTitle', {
            description,
            productName,
            defaultValue: 'Your {{description}} plan of {{productName}} is incomplete.',
          })}
          <em>
            {t('licensingNoticeDisplay.please', 'Please')}{' '}
            <BillingUI>
              <Link to="/account/plans">
                {t('licensingNoticeDisplay.updatePaymentInformation', 'update your payment information ')}
              </Link>
            </BillingUI>{' '}
            {t('licensingNoticeDisplay.toContinueService', 'to continue service.')}
          </em>
        </Notice>
      )
      break
    case 'CANCELED':
      notice = (
        <Notice severity="warning" button={UpgradeButton}>
          {t('licensingNoticeDisplay.canceledTitle', {
            description,
            productName,
            defaultValue: 'Your {{description}} plan of {{productName}} has been canceled.',
          })}
          <em>
            {t('licensingNoticeDisplay.pleaseCheck', 'Please check.')}{' '}
            <BillingUI>
              <Link to="/account/plans">{t('licensingNoticeDisplay.learnMore', 'Learn more.')}</Link>
            </BillingUI>
          </em>
        </Notice>
      )
      break
    case 'LIMIT_EXCEEDED':
      notice = (
        <Notice severity="warning" button={UpgradeButton}>
          {title} <LicensingTitle count={serviceLimit?.value} />
          <em>
            {t('licensingNoticeDisplay.exceededLimit', {
              count: (serviceLimit?.actual ?? 0) - (serviceLimit?.value ?? 0),
              defaultValue: 'You have exceeded your limit by {{count}}.',
            })}{' '}
            <BillingUI>
              <Link to="/account/plans">{t('licensingNoticeDisplay.learnMore', 'Learn more.')}</Link>
            </BillingUI>
          </em>
        </Notice>
      )
      break
    case 'EXPIRATION_WARNING':
      if (license?.expiration)
        notice = (
          <Notice severity="info" button={UpgradeButton}>
            {title} {t('licensingNoticeDisplay.willRenewOn', 'will renew on')}{' '}
            {/* replace with countdown */}
            <Timestamp variant="long" date={license?.expiration} />.
          </Notice>
        )
      break
    case 'PERSONAL_ORGANIZATION':
      if (license?.plan?.id === PERSONAL_PLAN_ID)
        notice = (
          <Notice button={UpgradeButton}>
            {t(
              'licensingNoticeDisplay.upgradeToProfessional',
              'Upgrade to a professional plan to enable full device list access and features.'
            )}
          </Notice>
        )
      break
  }

  return notice ? fullWidth ? notice : <ListItem>{notice}</ListItem> : null
}
