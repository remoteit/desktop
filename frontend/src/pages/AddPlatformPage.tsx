import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { makeStyles } from '@mui/styles'
import { useMediaQuery, Box, Divider } from '@mui/material'
import { AddPlatformServices } from '../components/AddPlatformServices'
import { AddPlatformTags } from '../components/AddPlatformTags'
import { AddDownload } from '../components/AddDownload'
import { AddDevice } from '../components/AddDevice'
import { platforms } from '../platforms'
import { spacing } from '../styling'
import { Body } from '../components/Body'
import { Icon } from '../components/Icon'

export const AddPlatformPage: React.FC = () => {
  let { platform = '' } = useParams<{ platform?: string }>()
  const [platformTags, setPlatformTags] = useState<string[]>([])
  const [applicationTypes, setApplicationTypes] = useState<number[]>([28])
  const smallScreen = useMediaQuery(`(max-width:1000px)`)
  const css = useStyles({ smallScreen })
  const platformObj = platforms.get(platform)

  return (
    <Body center>
      <Box display="flex" flexWrap="wrap" justifyContent="center" paddingBottom={5}>
        <Box className={css.icon}>
          <Icon name={platform} fontSize={100} platformIcon />
          {platformObj.installation?.command && (
            <>
              <Divider sx={{ marginTop: 4, width: '80%' }} />
              <AddPlatformServices types={applicationTypes} onChange={type => setApplicationTypes(type)} />
              <Divider sx={{ marginBottom: 1, marginTop: 2, width: '80%' }} />
              <AddPlatformTags tags={platformTags} onChange={tags => setPlatformTags(tags)} />
            </>
          )}
        </Box>
        <Box className={css.box}>
          {platformObj.installation?.command ? (
            <AddDevice platform={platformObj} tags={platformTags} types={applicationTypes} />
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
    '& .MuiIconButton-root': {
      minHeight: '3em',
      minWidth: 575,
      maxWidth: 575,
      marginTop: spacing.lg,
      marginBottom: spacing.lg,
    },
  }),
}))
