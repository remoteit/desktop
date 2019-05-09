import React from 'react'
import { Page } from '../Page'
import { PageHeading } from '../../components/PageHeading'
import { SignOutLinkController } from '../../controllers/SignOutLinkController'
// import styles from './SettingsPage.module.css'

export interface Props {}

export function SettingsPage({ ...props }: Props) {
  return (
    <Page>
      <PageHeading>Settings</PageHeading>
      <div className="bg-white bs-1 p-md">
        <SignOutLinkController />
      </div>
    </Page>
  )
}
