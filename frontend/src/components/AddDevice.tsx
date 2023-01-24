import React, { useEffect } from 'react'
import { Box, Typography } from '@mui/material'
import { platforms, IPlatform } from '../platforms'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { selectPermissions } from '../models/organization'
import { selectOrganization } from '../selectors/organizations'
import { DataCopy } from '../components/DataCopy'
import { Notice } from '../components/Notice'
import { Link } from '../components/Link'

type Props = {
  platform: IPlatform
  tags: string[]
  types: number[]
}

export const AddDevice: React.FC<Props> = ({ platform, tags, types }) => {
  const { organization, registrationCommand, permissions, userId } = useSelector((state: ApplicationState) => ({
    organization: selectOrganization(state),
    registrationCommand: state.ui.registrationCommand,
    permissions: selectPermissions(state),
    userId: state.user.id,
  }))
  const dispatch = useDispatch<Dispatch>()
  let accountId = organization.id || userId
  let accountName = organization.name

  useEffect(() => {
    const platformType = platforms.findType(platform.id)
    dispatch.devices.createRegistration({
      tags,
      accountId,
      services: types.map(type => ({ application: type })),
      platform: platformType,
      template: platform.installation?.command,
    })
    return function cleanup() {
      dispatch.ui.set({ registrationCommand: undefined }) // remove registration code so we don't redirect to new device page
    }
  }, [accountId, platform, tags, types])

  if (!permissions?.includes('MANAGE')) {
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
