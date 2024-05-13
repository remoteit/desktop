import React, { useState } from 'react'
import { State } from '../store'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useMediaQuery, Typography, Box, Stack, Divider, Theme } from '@mui/material'
import { AddPlatformServices } from '../components/AddPlatformServices'
import { selectPermissions } from '../selectors/organizations'
import { AddPlatformTags } from '../components/AddPlatformTags'
import { AddDownload } from '../components/AddDownload'
import { AddDevice } from '../components/AddDevice'
import { platforms } from '../platforms'
import { Body } from '../components/Body'
import { Icon } from '../components/Icon'

export const PlatformAddPage: React.FC = () => {
  let { platform = '', redirect } = useParams<{ platform?: string; redirect?: string }>()
  const platformObj = platforms.get(platform)
  const defaultServices = platformObj.services ? platformObj.services.map(s => s.application) : [28]
  const permissions = useSelector((state: State) => selectPermissions(state))
  const [platformTags, setPlatformTags] = useState<string[]>([])
  const [applicationTypes, setApplicationTypes] = useState<number[]>(defaultServices)
  const xs = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'))

  return (
    <Body center>
      <Stack
        flexDirection={{ xs: 'column', md: 'row' }}
        justifyContent={{ xs: 'center', md: 'left' }}
        alignItems={{ xs: 'left', md: 'center' }}
        paddingX={{ xs: 3, md: 0 }}
        paddingBottom={5}
        flexWrap="wrap"
      >
        <Stack
          maxWidth={{ md: 130 }}
          marginRight={{ md: 3 }}
          marginBottom={{ xs: 3, md: 0 }}
          flexDirection={{ xs: 'row', md: 'column' }}
        >
          <Icon name={platform} fontSize={100} inlineLeft={xs} platformIcon />
          {platformObj.installation?.command && permissions?.includes('MANAGE') && (
            <Stack alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
              {!xs && <Divider sx={{ marginTop: 4, width: '80%' }} />}
              <AddPlatformServices
                types={applicationTypes}
                onChange={type => setApplicationTypes(type)}
                alignItems={{ xs: 'flex-start', md: 'flex-end' }}
              />
              <AddPlatformTags
                tags={platformTags}
                onChange={tags => setPlatformTags(tags)}
                alignItems={{ xs: 'flex-start', md: 'flex-end' }}
              />
            </Stack>
          )}
        </Stack>
        <Stack
          sx={{
            alignItems: xs ? 'left' : undefined,
            borderLeft: xs ? undefined : '1px solid',
            borderLeftColor: 'grayLighter.main',
            paddingLeft: xs ? 0 : 4.5,
            paddingRight: xs ? 0 : 0,
            paddingTop: 2.25,
            paddingBottom: 2.25,
            maxWidth: 650,
            width: xs ? '100%' : 650,
            '& .MuiAvatar-root': { marginTop: 0.375 },
            '& .MuiTypography-body2': { marginBottom: 0.75 },
          }}
        >
          {platformObj.installation?.command && !platformObj.installation?.download ? (
            <AddDevice platform={platformObj} tags={platformTags} types={applicationTypes} redirect={redirect} />
          ) : (
            <>
              <AddDownload platform={platformObj} />
              {platformObj.hasScreenView && (
                <>
                  <Typography variant="body2" color="textSecondary" paddingBottom={1}>
                    Or use this registration code to manually claim the ScreenView app.
                  </Typography>
                  <AddDevice
                    platform={platformObj}
                    tags={platformTags}
                    types={applicationTypes}
                    redirect={redirect}
                    minimal
                  />
                </>
              )}
            </>
          )}
        </Stack>
      </Stack>
    </Body>
  )
}
