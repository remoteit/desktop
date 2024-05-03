import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { makeStyles } from '@mui/styles'
import { useSelector } from 'react-redux'
import { State } from '../store'
import { useMediaQuery, Typography, Box, Stack, Divider, Theme } from '@mui/material'
import { AddPlatformServices } from '../components/AddPlatformServices'
import { selectPermissions } from '../selectors/organizations'
import { AddPlatformTags } from '../components/AddPlatformTags'
import { AddDownload } from '../components/AddDownload'
import { AddDevice } from '../components/AddDevice'
import { platforms } from '../platforms'
import { spacing } from '../styling'
import { Body } from '../components/Body'
import { Icon } from '../components/Icon'

export const PlatformAddPage: React.FC = () => {
  let { platform = '', redirect } = useParams<{ platform?: string; redirect?: string }>()
  const platformObj = platforms.get(platform)
  const defaultServices = platformObj.services ? platformObj.services.map(s => s.application) : [28]
  const permissions = useSelector((state: State) => selectPermissions(state))
  const [platformTags, setPlatformTags] = useState<string[]>([])
  const [applicationTypes, setApplicationTypes] = useState<number[]>(defaultServices)
  const smallScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'))
  const css = useStyles({ smallScreen })

  return (
    <Body center>
      <Stack
        flexDirection={smallScreen ? 'column-reverse' : 'row'}
        justifyContent="center"
        alignItems="center"
        flexWrap="wrap"
        paddingBottom={5}
      >
        <Box className={css.icon}>
          <Icon name={platform} fontSize={100} platformIcon />
          {platformObj.installation?.command && permissions?.includes('MANAGE') && (
            <Stack alignItems={smallScreen ? 'flex-start' : 'flex-end'}>
              <Divider sx={{ marginTop: 4, width: '80%' }} />
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
        </Box>
        <Box className={css.box}>
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
        </Box>
      </Stack>
    </Body>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  icon: ({ smallScreen }: any) => ({
    maxWidth: 130,
    marginTop: spacing.md,
    marginRight: smallScreen ? 0 : spacing.xl,
    marginBottom: smallScreen ? spacing.lg : 0,
  }),
  box: ({ smallScreen }: any) => ({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: smallScreen ? 'center' : undefined,
    borderLeft: smallScreen ? undefined : `1px solid ${palette.divider}`,
    paddingLeft: smallScreen ? 0 : spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    maxWidth: 650,
    width: smallScreen ? '100%' : 650,
    '& .MuiAvatar-root': { marginTop: spacing.xxs },
    '& .MuiTypography-body2': { marginBottom: spacing.xs },
    '& .MuiTypography-h3': smallScreen ? { paddingLeft: spacing.md, paddingRight: spacing.md } : undefined,

    // '& .MuiListItem-root': {
    //   minHeight: 80,
    //   minWidth: 575,
    //   maxWidth: 575,
    //   marginTop: spacing.sm,
    //   marginBottom: spacing.sm,
    // },
  }),
}))
