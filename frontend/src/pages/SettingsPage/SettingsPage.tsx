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
    <Body className="bg-white p-lg">
      <PageHeading>Settings</PageHeading>
      <SignOutLinkController />
      <div className="my-md">
        <Link
          href={encodeURI(
            `mailto:support@remote.it?subject=Desktop Application Feedback`
          )}
        >
          <Icon name="envelope" className="mr-sm" />
          Send feedback
        </Link>
      </div>
      <QuitLinkController />
      <h4 className="mt-lg">Advanced</h4>
      <SearchOnlyToggle />
    </Body>
  )
}
