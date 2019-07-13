import React from 'react'
import { PageHeading } from '../../components/PageHeading'
import { SignOutLinkController } from '../../controllers/SignOutLinkController'
import { QuitLinkController } from '../../controllers/QuitLinkController'
import { Link } from '@material-ui/core'
import { Icon } from '../../components/Icon'
import { Body } from '../../components/Body'
import { SearchOnlyToggle } from '../../components/SearchOnlyToggle'

export interface Props {}

export function SettingsPage() {
  return (
    <Body className="bg-grey px-lg py-md p-md">
      <PageHeading className="mb-md">Settings</PageHeading>
      <div className="bg-white rad-sm py-sm">
        <SignOutLinkController />
        <Link
          href={encodeURI(
            `mailto:support@remote.it?subject=Desktop Application Feedback`
          )}
        >
          <Icon name="envelope" className="mr-sm" />
          Send feedback
        </Link>
        <QuitLinkController />
      </div>
      <div className="bg-white rad-sm p-md mt-md">
        <SearchOnlyToggle />
      </div>
    </Body>
  )
}
