import React from 'react'
import { Link } from '../../Link'
import { LinkProps } from '../../Link/Link'

export type IOSBadgeProps = LinkProps

export function IOSBadge(props: IOSBadgeProps): JSX.Element {
  return (
    <Link href="https://itunes.apple.com/us/app/remote-it/id1437569166?mt=8" {...props}>
      <img
        src="https://linkmaker.itunes.apple.com/en-us/badge-lrg.svg?releaseDate=2019-01-05&kind=iossoftware&bubble=ios_apps"
        style={{ height: '40px', paddingRight: '5px' }}
      />
    </Link>
  )
}
