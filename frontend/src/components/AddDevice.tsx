import React, { useEffect, useState } from 'react'
import { platforms, IPlatform } from '../platforms'
import { List, Box, Typography } from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { selectPermissions, selectOrganization } from '../selectors/organizations'
import { OrganizationIndicator } from '../components/OrganizationIndicator'
import { ListItemCopy } from './ListItemCopy'
import { Notice } from './Notice'
import { Link } from './Link'

type Props = {
  platform: IPlatform
  tags: string[]
  types: number[]
  redirect?: string
}

export const AddDevice: React.FC<Props> = ({ platform, tags, types, redirect }) => {
  const { organization, registrationCommand, registrationCode, permissions, fetching, user } = useSelector(
    (state: ApplicationState) => ({
      organization: selectOrganization(state),
      registrationCommand: state.ui.registrationCommand,
      registrationCode: state.ui.registrationCode,
      permissions: selectPermissions(state),
      fetching: state.ui.fetching,
      user: state.user,
    })
  )
  const [redirected, setRedirected] = useState<boolean>(false)
  const dispatch = useDispatch<Dispatch>()
  let accountId = organization.id || user.id

  useEffect(() => {
    if (fetching) return
    ;(async () => {
      const platformType = platforms.findType(platform.id)
      const code = await dispatch.devices.createRegistration({
        tags,
        accountId,
        services: types.map(type => ({ application: type })),
        platform: platformType,
        template: platform.installation?.command,
      })

      if (!redirect || redirected) return
      window.location.href = `${decodeURIComponent(redirect)}&code=${code}`
      setRedirected(true)
    })()

    return function cleanup() {
      dispatch.ui.set({ registrationCommand: undefined }) // remove registration code so we don't redirect to new device page
    }
  }, [accountId, platform, tags, types, fetching])

  if (!permissions?.includes('MANAGE')) {
    return (
      <Box>
        <Notice>You must have the register permission to add a device to this organization.</Notice>
      </Box>
    )
  }

  return (
    <>
      <OrganizationIndicator avatarSize={42} marginBottom={3} />
      <Typography variant="h3">
        {platform.installation?.qualifier},
        {redirect ? <> copy the code below into your {platform.name}:</> : <> run this command on your device:</>}
      </Typography>
      <List>
        <ListItemCopy
          showBackground
          value={
            fetching
              ? '...application loading...'
              : registrationCommand
              ? registrationCommand
              : '...generating command...'
          }
          link={redirect && registrationCode ? `${decodeURIComponent(redirect)}&code=${registrationCode}` : undefined}
          label={platform.installation?.label}
        />
      </List>
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
