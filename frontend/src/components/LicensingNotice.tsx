import React from 'react'
import { selectFullLicense, lookupLicenseProductId } from '../models/plans'
import { LicensingNoticeDisplay } from './LicensingNoticeDisplay'
import { ApplicationState } from '../store'
import { useSelector } from 'react-redux'

type Props = { instance?: IInstance; license?: ILicense; fullWidth?: boolean }

export const LicensingNotice: React.FC<Props> = ({ instance, fullWidth, ...props }) => {
  const { noticeType, license, informed, serviceLimit, managePath } = useSelector((state: ApplicationState) => {
    let productId
    if (instance && state.auth.user?.id === instance.owner.id) productId = lookupLicenseProductId(instance)
    return selectFullLicense(state, { productId, license: props.license })
  })

  if (!noticeType || !license || informed) return null

  return (
    <LicensingNoticeDisplay
      noticeType={noticeType}
      license={license}
      serviceLimit={serviceLimit}
      managePath={managePath}
      fullWidth={fullWidth}
    />
  )
}
