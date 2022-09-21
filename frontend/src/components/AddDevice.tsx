import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { getOrganization, selectPermissions } from '../models/organization'
import { Box, Typography } from '@mui/material'
import { platforms, IPlatform } from '../platforms'
import { DataCopy } from '../components/DataCopy'
import { Notice } from '../components/Notice'
import { Link } from '../components/Link'

export const AddDevice: React.FC<{ platform: IPlatform }> = ({ platform }) => {
  const { organization, registrationCommand, permissions } = useSelector((state: ApplicationState) => ({
    organization: getOrganization(state),
    registrationCommand: state.ui.registrationCommand,
    permissions: selectPermissions(state),
  }))
  const dispatch = useDispatch<Dispatch>()
  let accountId = organization.id
  let accountName = organization.name

  useEffect(() => {
    const platformType = platforms.findType(platform.name)
    dispatch.devices.createRegistration({
      services: [{ application: 28 }],
      accountId,
      platform: platformType,
      template: platform.installation?.command,
    }) // ssh
    return function cleanup() {
      dispatch.ui.set({ registrationCommand: undefined }) // remove registration code so we don't redirect to new device page
    }
  }, [accountId, platform])

  if (permissions?.includes('MANAGE')) {
    accountId = organization.id
    accountName = organization.name
  } else {
    return (
      <Box>
        <Notice>You must have the register permission to add a device to this organization.</Notice>
      </Box>
    )
  }

  return (
    <>
      <Typography variant="body2" color="textSecondary">
        {platform.installation?.qualifier}
      </Typography>
      <Typography variant="h3">
        Run this terminal command on your device to register it {accountName && <>with {accountName}</>}
      </Typography>
      <DataCopy showBackground value={registrationCommand ? registrationCommand : '...generating command...'} />
      <Typography variant="body2" color="textSecondary">
        {platform.installation?.instructions ? (
          platform.installation.instructions
        ) : (
          <>
            This page will automatically update when complete.
            {platform.installation?.link && (
              <Link href={platform.installation?.link}>Troubleshooting & instructions.</Link>
            )}
          </>
        )}
      </Typography>
    </>
  )
}
