import React from 'react'
import { PageHeading } from '../../components/PageHeading'
import { SignOutLinkController } from '../../controllers/SignOutLinkController'
import { Link, Paper } from '@material-ui/core'
import { Icon } from '../../components/Icon'
import { Body } from '../../components/Body'
import { SearchOnlyToggle } from '../../components/SearchOnlyToggle'

export interface Props {}

export function SettingsPage({ ...props }: Props) {
  return (
    <Body className="px-md">
      <PageHeading>Settings</PageHeading>
      <Paper className="p-md">
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
        <SearchOnlyToggle />
      </Paper>
    </Body>
  )
}
