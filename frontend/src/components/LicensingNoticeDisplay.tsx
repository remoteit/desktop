import React from 'react'
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
  const informed = useSelector((state: State) => state.plans.informed)
  const { plans } = useDispatch<Dispatch>()

  if (informed) return null

  const onClose = () => plans.set({ informed: true })

  let notice: React.ReactNode | null = null
  const title = `Your ${license?.plan.description} plan of ${license?.plan.product.name}`

  const UpgradeButton = (
    <>
      <BillingUI>
        <Link to="/account/plans">
          <Button color="primary" variant="contained" size="small">
            Upgrade
          </Button>
        </Link>
      </BillingUI>
      <Tooltip title="Close">
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
          {title} has expired.
          <em>
            Please upgrade your license.{' '}
            <BillingUI>
              <Link to="/account/plans">Learn more.</Link>
            </BillingUI>
          </em>
        </Notice>
      )
      break
    case 'PAST_DUE':
      notice = (
        <Notice severity="error">
          {title} is past due.
          <em>
            Please update your payment method.{' '}
            <BillingUI>
              <Link to="/account/plans">Learn more.</Link>
            </BillingUI>
          </em>
        </Notice>
      )
      break
    case 'INCOMPLETE_EXPIRED':
    case 'INCOMPLETE':
      notice = (
        <Notice severity="warning">
          {title} is incomplete.
          <em>
            Please{' '}
            <BillingUI>
              <Link to="/account/plans">update your payment information </Link>
            </BillingUI>{' '}
            to continue service.
          </em>
        </Notice>
      )
      break
    case 'CANCELED':
      notice = (
        <Notice severity="warning" button={UpgradeButton}>
          {title} has been canceled.
          <em>
            Please check.{' '}
            <BillingUI>
              <Link to="/account/plans">Learn more.</Link>
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
            You have exceeded your limit by {serviceLimit?.actual - serviceLimit?.value}.{' '}
            <BillingUI>
              <Link to="/account/plans">Learn more.</Link>
            </BillingUI>
          </em>
        </Notice>
      )
      break
    case 'EXPIRATION_WARNING':
      if (license?.expiration)
        notice = (
          <Notice severity="info" button={UpgradeButton}>
            {title} will renew on {/* replace with countdown */}
            <Timestamp variant="long" date={license?.expiration} />.
          </Notice>
        )
      break
    case 'PERSONAL_ORGANIZATION':
      if (license?.plan?.id === PERSONAL_PLAN_ID)
        notice = (
          <Notice button={UpgradeButton}>
            Upgrade to a professional plan to enable full device list access and features.
          </Notice>
        )
      break
  }

  return notice ? fullWidth ? notice : <ListItem>{notice}</ListItem> : null
}
