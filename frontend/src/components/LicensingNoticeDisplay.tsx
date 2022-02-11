import React from 'react'
import { ListItem, Button, Tooltip, IconButton } from '@material-ui/core'
import { PERSONAL_PLAN_ID } from '../models/licensing'
import { Dispatch } from '../store'
import { LicensingTitle } from './LicensingTitle'
import { useDispatch } from 'react-redux'
import { dateOptions } from './Duration/Duration'
import { Link } from 'react-router-dom'
import { Notice } from './Notice'
import { Icon } from './Icon'

type Props = {
  noticeType: string
  license: ILicense | null
  serviceLimit?: ILimit
  managePath?: string
  fullWidth?: boolean
}

export const LicensingNoticeDisplay: React.FC<Props> = ({
  noticeType,
  license,
  serviceLimit,
  managePath = '/settings/plans',
  fullWidth,
}) => {
  const { licensing } = useDispatch<Dispatch>()

  const onClose = () => licensing.set({ informed: true })

  let notice: React.ReactElement | null = null
  const title = `Your ${license?.plan.description} plan of ${license?.plan.product.name}`

  const UpgradeButton = (
    <>
      <Link to={managePath}>
        <Button color="primary" variant="contained" size="small">
          Upgrade
        </Button>
      </Link>
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
            Please upgrade your license. <Link to={managePath}>Learn more.</Link>
          </em>
        </Notice>
      )
      break
    case 'PAST_DUE':
      notice = (
        <Notice severity="danger">
          {title} is past due.
          <em>
            Please update your payment method. <Link to={managePath}>Learn more.</Link>
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
            Please <Link to={managePath}>update your payment information </Link> to continue service.
          </em>
        </Notice>
      )
      break
    case 'CANCELED':
      notice = (
        <Notice severity="warning" button={UpgradeButton}>
          {title} has been canceled.
          <em>
            Please please check. <Link to={managePath}>Learn more.</Link>
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
            <Link to={managePath}>Learn more.</Link>
          </em>
        </Notice>
      )
      break
    case 'EXPIRATION_WARNING':
      if (license?.expiration)
        notice = (
          <Notice severity="info" button={UpgradeButton}>
            {title} will renew on {/* replace with countdown */}
            {license?.expiration.toLocaleString(undefined, dateOptions)}.
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

  return fullWidth ? notice : <ListItem>{notice}</ListItem>
}
