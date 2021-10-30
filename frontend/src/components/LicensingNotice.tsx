import React from 'react'
import { selectLicense, lookupLicenseProductId } from '../models/licensing'
import { LicensingNoticeDisplay } from './LicensingNoticeDisplay'
import { ApplicationState } from '../store'
import { useSelector } from 'react-redux'

type Props = { device?: IDevice; license?: ILicense; fullWidth?: boolean }

export const LicensingNotice: React.FC<Props> = ({ device, fullWidth, ...props }) => {
  const { noticeType, license, informed, serviceLimit, managePath } = useSelector((state: ApplicationState) => {
    let productId
    if (device && state.auth.user?.id === device.owner.id) productId = lookupLicenseProductId(device)
    return selectLicense(state, { productId, license: props.license })
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
