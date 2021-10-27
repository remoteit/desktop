import React from 'react'
import { ListItem, Button, Tooltip, IconButton } from '@material-ui/core'
import { Dispatch } from '../store'
import { LicensingTitle } from './LicensingTitle'
import { useDispatch } from 'react-redux'
import { dateOptions } from './Duration/Duration'
import { Link } from 'react-router-dom'
import { Notice } from './Notice'
import { Icon } from './Icon'

type Props = {
  noticeType: string
  license: ILicense
  serviceLimit?: ILimit
  managePath?: string
  fullWidth?: boolean
}

export const LicensingNoticeDisplay: React.FC<Props> = ({
  noticeType,
  license,
  serviceLimit,
  managePath = '',
  fullWidth,
}) => {
  const { licensing } = useDispatch<Dispatch>()

  const onClose = () => licensing.set({ informed: true })

  let notice: React.ReactElement | null = null
  const title = `Your ${license.plan.description} plan of ${license.plan.product.name}`

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

  if (noticeType === 'EXPIRED')
    notice = (
      <Notice severity="warning" button={UpgradeButton}>
        {title} has expired.
        <em>
          Please upgrade your license. <Link to={managePath}>Learn more.</Link>
        </em>
      </Notice>
    )
  else if (noticeType === 'PAST_DUE')
    notice = (
      <Notice severity="danger">
        {title} is past due.
        <em>
          Please update your payment method. <Link to={managePath}>Learn more.</Link>
        </em>
      </Notice>
    )
  else if (noticeType === 'INCOMPLETE_EXPIRED' || noticeType === 'INCOMPLETE')
    notice = (
      <Notice severity="warning">
        {title} is incomplete.
        <em>
          Please <Link to={managePath}>update your payment information </Link> to continue service.
        </em>
      </Notice>
    )
  else if (noticeType === 'CANCELED')
    notice = (
      <Notice severity="warning" button={UpgradeButton}>
        {title} has been canceled.
        <em>
          Please please check. <Link to={managePath}>Learn more.</Link>
        </em>
      </Notice>
    )
  else if (noticeType === 'LIMIT_EXCEEDED')
    notice = (
      <Notice severity="warning" button={UpgradeButton}>
        {title} <LicensingTitle count={serviceLimit?.value} />
        <em>
          You have exceeded your limit by {serviceLimit?.actual - serviceLimit?.value}.{' '}
          <Link to={managePath}>Learn more.</Link>
        </em>
      </Notice>
    )
  else if (noticeType === 'EXPIRATION_WARNING' && license.expiration)
    notice = (
      <Notice severity="info" button={UpgradeButton}>
        {title} will renew on {/* replace with countdown */}
        {license.expiration.toLocaleString(undefined, dateOptions)}.
      </Notice>
    )

  return fullWidth ? notice : <ListItem>{notice}</ListItem>
}
