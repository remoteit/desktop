import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { getOrganization, selectPermissions } from '../models/organization'
import { Box, Typography, Link } from '@material-ui/core'
import { DataCopy } from '../components/DataCopy'
import { Notice } from '../components/Notice'
import { Help } from '../components/Help'
import platforms from '../platforms'

export const AddDevice: React.FC<{ platformName: string }> = ({ platformName }) => {
  const { organization, registrationCommand, permissions } = useSelector((state: ApplicationState) => ({
    organization: getOrganization(state),
    registrationCommand: state.ui.registrationCommand,
    permissions: selectPermissions(state),
  }))
  const dispatch = useDispatch<Dispatch>()
  let accountId = organization.id
  let accountName = organization.name

  useEffect(() => {
    const platformType = platforms.findType(platformName)
    dispatch.devices.createRegistration({ services: [{ application: 28 }], accountId, platform: platformType }) // ssh
    return function cleanup() {
      dispatch.ui.set({ registrationCommand: undefined }) // remove registration code so we don't redirect to new device page
    }
  }, [accountId, platformName])

  if (permissions?.includes('MANAGE')) {
    accountId = organization.id
    accountName = organization.name
  } else {
    return (
      <Box>
        <Notice>You must have the manage permission to add a device to this organization.</Notice>
      </Box>
    )
  }

  return (
    <>
      <Typography variant="caption" gutterBottom>
        For any Raspberry Pi or Linux based system
      </Typography>
      <Typography variant="h3">
        Run this command to register the device{' '}
        {accountName && (
          <>
            with <Help message="You can register to any organization you are an Admin">{accountName}</Help>
          </>
        )}
      </Typography>
      <section>
        <DataCopy showBackground value={registrationCommand ? registrationCommand : '...generating command...'} />
      </section>
      <Typography variant="body2" color="textSecondary">
        This page will automatically update when complete.
        <Link href="https://link.remote.it/support/streamline-install" target="_blank">
          Troubleshooting & instructions.
        </Link>
      </Typography>{' '}
    </>
  )
}
