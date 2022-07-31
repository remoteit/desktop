import React from 'react'
import { Link } from '../../Link'
import { LinkProps } from '../../Link/Link'

export type AndroidBadgeProps = LinkProps

export function AndroidBadge(props: AndroidBadgeProps): JSX.Element {
  return (
    <Link
      href="https://play.google.com/store/apps/details?id=com.remoteit&pcampaignid=MKT-Other-global-all-co-prtnr-py-PartBadge-Mar2515-1"
      {...props}
    >
      <img
        src="https://d33wubrfki0l68.cloudfront.net/395f396419a38ec25b21b1c2fa8de0b11ced972b/2e6d0/art/google-play.png"
        style={{ height: '40px' }}
      />
    </Link>
  )
}
