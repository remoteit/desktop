import React from 'react'
import { IPlatform } from '../platforms'
import { List, Typography } from '@mui/material'
import { OrganizationIndicator } from '../components/OrganizationIndicator'
import { CopyRegistrationCode } from './CopyRegistrationCode'
import { useAutoRegistration } from '../hooks/useAutoRegistration'
import { Link } from './Link'

type Props = {
  platform: IPlatform
  serviceTypes: number[]
  tags?: string[]
  redirect?: string
  minimal?: boolean
}

export const AddDevice: React.FC<Props> = ({ platform, tags, serviceTypes, redirect, minimal }) => {
  const { registrationCode, registrationCommand, redirectUrl, fetching } = useAutoRegistration({
    platform,
    tags,
    serviceTypes,
    redirect,
  })
  const codeOnly = platform.installation?.command === '[CODE]'

  const codeBlock = (
    <List disablePadding={minimal}>
      <CopyRegistrationCode
        value={
          fetching ? 'application loading...' : registrationCommand ? registrationCommand : 'generating command...'
        }
        code={registrationCode}
        link={redirectUrl}
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
            {platform.installation?.link && <Link href={platform.installation?.link}>Instructions.</Link>}
            {platform.installation?.altLink && (
              <>
                In production <u>do not clone devices</u>, please follow these
                <Link href={platform.installation.altLink}>oem instructions.</Link>
              </>
            )}
          </>
        )}
      </Typography>
    </>
  )
}
