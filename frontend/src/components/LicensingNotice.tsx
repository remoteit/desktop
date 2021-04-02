import React from 'react'
import { selectLicense, lookupLicenseProductId } from '../models/licensing'
import { ListItem, Link, Button, Tooltip, IconButton } from '@material-ui/core'
import { ApplicationState, Dispatch } from '../store'
import { LicensingTitle } from './LicensingTitle'
import { useDispatch, useSelector } from 'react-redux'
import { dateOptions } from './Duration/Duration'
import { Notice } from './Notice'
import { makeStyles } from '@material-ui/core/styles'
import { spacing } from '../styling'
import { Icon } from './Icon'

type Props = { device?: IDevice; license?: ILicense }

const learnMoreLink = (
  <Link href="https://link.remote.it/documentation-aws/setup" target="_blank">
    Learn more.
  </Link>
)

export const LicensingNotice: React.FC<Props> = props => {
  const css = useStyles()
  const { noticeType, license, informed, serviceLimit, upgradeUrl = '' } = useSelector((state: ApplicationState) => {
    let productId = props.license?.plan.product.id
    if (props.device && state.auth.user?.id === props.device.owner.id) productId = lookupLicenseProductId(props.device)
    return selectLicense(state, productId)
  })

  const { licensing } = useDispatch<Dispatch>()

  if (!license || !noticeType) return null

  const onClose = () => {
    licensing.set({ informed: true })
  }

  let notice
  const title = `Your ${license.plan.description} plan of ${license.plan.product.name}`
  const UpgradeButton = (
    <>
      <Button color="primary" variant="contained" href={upgradeUrl} size="small" target="_blank">
        Upgrade
      </Button>
      <Tooltip title="Close" className={css.styles}>
        <IconButton onClick={onClose}>
          <Icon name="times" size="md" color="primary" fixedWidth />
        </IconButton>
      </Tooltip>
    </>
  )

  if (noticeType === 'EXPIRATION_WARNING' && license.expiration && !informed)
    notice = (
      <Notice severity="info" button={UpgradeButton}>
        {title} will expire on {/* replace with countdown */}
        {license.expiration.toLocaleString(undefined, dateOptions)}.
      </Notice>
    )

  if (noticeType === 'LIMIT_EXCEEDED' && !informed)
    notice = (
      <Notice severity="warning" button={UpgradeButton}>
        {title} <LicensingTitle count={serviceLimit?.value} />
        <em>
          You have exceeded your limit by {serviceLimit?.actual - serviceLimit?.value}.{learnMoreLink}
        </em>
      </Notice>
    )

  if (noticeType === 'EXPIRED' && !informed)
    notice = (
      <Notice severity="warning" button={UpgradeButton}>
        {title} has expired.
        <em>Please upgrade your license.{learnMoreLink}</em>
      </Notice>
    )

  return <ListItem>{notice}</ListItem>
}

const useStyles = makeStyles({
  styles: {
    backgroundColor: 'transparent',
    marginLeft: spacing.sm,
    paddingRight: '0px',
    '&:hover': { backgroundColor: 'transparent' },
  },
})
