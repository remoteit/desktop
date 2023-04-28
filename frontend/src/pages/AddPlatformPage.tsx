import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { makeStyles } from '@mui/styles'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { useMediaQuery, ListItemText, Box, Divider } from '@mui/material'
import { selectPermissions, selectOrganization } from '../selectors/organizations'
import { AddPlatformServices } from '../components/AddPlatformServices'
import { AddPlatformTags } from '../components/AddPlatformTags'
import { AddDownload } from '../components/AddDownload'
import { AddDevice } from '../components/AddDevice'
import { platforms } from '../platforms'
import { spacing } from '../styling'
import { Avatar } from '../components/Avatar'
import { Body } from '../components/Body'
import { Icon } from '../components/Icon'

export const AddPlatformPage: React.FC = () => {
  let { platform = '', redirect } = useParams<{ platform?: string; redirect?: string }>()
  const platformObj = platforms.get(platform)
  const defaultServices = platformObj.services ? platformObj.services.map(s => s.application) : [28]
  const { permissions, organization } = useSelector((state: ApplicationState) => ({
    permissions: selectPermissions(state),
    organization: selectOrganization(state),
  }))
  const [platformTags, setPlatformTags] = useState<string[]>([])
  const [applicationTypes, setApplicationTypes] = useState<number[]>(defaultServices)
  const smallScreen = useMediaQuery(`(max-width:1000px)`)
  const css = useStyles({ smallScreen })

  return (
    <Body center>
      <Box display="flex" flexWrap="wrap" justifyContent="center" paddingBottom={5}>
        <Box className={css.icon}>
          <Icon name={platform} fontSize={100} platformIcon />
          <Box display="flex" alignItems="center" marginTop={2}>
            <Avatar email={organization.account.email} inline />
            <ListItemText primary={organization.name || 'Personal'} secondary="Account" />
          </Box>
          {platformObj.installation?.command && permissions?.includes('MANAGE') && (
            <>
              <Divider sx={{ marginTop: 2, width: '80%' }} />
              <AddPlatformServices types={applicationTypes} onChange={type => setApplicationTypes(type)} />
              <AddPlatformTags tags={platformTags} onChange={tags => setPlatformTags(tags)} />
            </>
          )}
        </Box>
        <Box className={css.box}>
          {platformObj.installation?.command ? (
            <AddDevice platform={platformObj} tags={platformTags} types={applicationTypes} redirect={redirect} />
          ) : (
            <AddDownload platform={platformObj} />
          )}
        </Box>
      </Box>
    </Body>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  icon: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    maxWidth: 130,
    marginTop: spacing.md,
    marginRight: spacing.xl,
  },
  box: ({ smallScreen }: any) => ({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    borderLeft: smallScreen ? undefined : `1px solid ${palette.divider}`,
    paddingLeft: smallScreen ? 0 : spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    maxWidth: 600,
    '& .MuiButton-root': { marginTop: spacing.lg, marginBottom: spacing.md },
    '& .MuiTypography-body2': { marginBottom: spacing.xs },
    '& .MuiListItem-root': {
      minHeight: 80,
      minWidth: 575,
      maxWidth: 575,
      marginTop: spacing.lg,
      marginBottom: spacing.lg,
    },
  }),
}))
