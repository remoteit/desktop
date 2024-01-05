import React, { useEffect, useState } from 'react'
import { windowOpen } from '../services/Browser'
import { platforms, IPlatform } from '../platforms'
import { List, Box, Typography } from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { selectPermissions, selectOrganization } from '../selectors/organizations'
import { OrganizationIndicator } from '../components/OrganizationIndicator'
import { CopyRegistrationCode } from './CopyRegistrationCode'
import { Notice } from './Notice'
import { Link } from './Link'

type Props = {
  platform: IPlatform
  types: number[]
  tags?: string[]
  redirect?: string
  minimal?: boolean
}

export const AddDevice: React.FC<Props> = ({ platform, tags, types, redirect, minimal }) => {
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
  const codeOnly = platform.installation?.command === '[CODE]'
  let accountId = organization.id || user.id

  function getRedirect(location: string, code: string) {
    const url = new URL(decodeURIComponent(location))
    url.searchParams.set('code', code)
    return url.toString()
  }

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
      try {
        const url = getRedirect(redirect, code)
        console.log('REDIRECT TO:', url)
        windowOpen(url, '_blank', true)
        setRedirected(true)
      } catch (error) {
        console.warn('Failed to redirect to:', error)
      }
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

  const codeBlock = (
    <List disablePadding={minimal}>
      <CopyRegistrationCode
        value={
          fetching ? 'application loading...' : registrationCommand ? registrationCommand : 'generating command...'
        }
        code={registrationCode}
        link={redirect && registrationCode ? getRedirect(redirect, registrationCode) : undefined}
        label={platform.installation?.label}
        sx={{ textAlign: 'left' }}
      />
    </List>
  )

  return minimal ? (
    codeBlock
  ) : (
    <>
      <OrganizationIndicator avatarSize={42} marginBottom={3} display="inline-flex" />
      <Typography variant="h3" sx={{ marginBottom: 1 }}>
        {platform.installation?.qualifier},
        {codeOnly ? <> copy the code below:</> : <> run this command on your device:</>}
      </Typography>
      {codeBlock}
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
