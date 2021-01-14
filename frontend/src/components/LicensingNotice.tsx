import React from 'react'
import { selectLicense, lookupLicenseProductId } from '../models/licensing'
import { ListItem, Link, Button } from '@material-ui/core'
import { ApplicationState } from '../store'
import { LicensingTitle } from './LicensingTitle'
import { useSelector } from 'react-redux'
import { dateOptions } from './Duration/Duration'
import { Notice } from './Notice'

type Props = { device?: IDevice; license?: ILicense }

const learnMoreLink = (
  <Link href="https://link.remote.it/documentation-aws/setup" target="_blank">
    Learn more.
  </Link>
)

export const LicensingNotice: React.FC<Props> = props => {
  const { noticeType, license, serviceLimit, upgradeUrl = '' } = useSelector((state: ApplicationState) => {
    let productId = props.license?.plan.product.id
    if (props.device && state.auth.user?.id === props.device.owner.id) productId = lookupLicenseProductId(props.device)
    return selectLicense(state, productId)
  })

  if (!license || !noticeType) return null

  let notice
  const title = `Your ${license.plan.description} plan of ${license.plan.product.name}`
  const UpgradeButton = (
    <Button color="primary" variant="contained" href={upgradeUrl} size="small" target="_blank">
      Upgrade
    </Button>
  )

  if (noticeType === 'EXPIRATION_WARNING')
    notice = (
      <Notice severity="info" button={UpgradeButton}>
        {title} will expire on {/* replace with countdown */}
        {license.expiration.toLocaleString(undefined, dateOptions)}.
      </Notice>
    )

  if (noticeType === 'LIMIT_EXCEEDED')
    notice = (
      <Notice severity="warning" button={UpgradeButton}>
        {title} <LicensingTitle count={serviceLimit?.value} />
        <em>
          You have exceeded your limit by {serviceLimit?.actual - serviceLimit?.value}.{learnMoreLink}
        </em>
      </Notice>
    )

  if (noticeType === 'EXPIRED')
    notice = (
      <Notice severity="warning" button={UpgradeButton}>
        {title} has expired.
        <em>Please upgrade your license.{learnMoreLink}</em>
      </Notice>
    )

  return <ListItem>{notice}</ListItem>
}
