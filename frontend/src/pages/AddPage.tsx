import React from 'react'
import { useParams } from 'react-router-dom'
import { makeStyles, useMediaQuery, Box } from '@material-ui/core'
import { AddDownload } from '../components/AddDownload'
import { AddDevice } from '../components/AddDevice'
import { platforms } from '../platforms'
import { spacing } from '../styling'
import { Body } from '../components/Body'
import { Icon } from '../components/Icon'

export const AddPage: React.FC = () => {
  let { platform = '' } = useParams<{ platform?: string }>()
  const smallScreen = useMediaQuery(`(max-width:1000px)`)
  const css = useStyles({ smallScreen })
  const platformObj = platforms.get(platform)

  return (
    <Body center>
      <Box display="flex" flexWrap="wrap" justifyContent="center" paddingBottom={5}>
        <Box className={css.icon}>
          <Icon name={platform} fontSize={100} platformIcon />
        </Box>
        <Box className={css.box}>
          {platformObj.installation?.command ? (
            <AddDevice platform={platformObj} />
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
    marginTop: spacing.xl,
    marginRight: spacing.xl,
  },
  box: ({ smallScreen }: any) => ({
    borderLeft: smallScreen ? undefined : `1px solid ${palette.divider}`,
    paddingLeft: smallScreen ? 0 : spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    '& .MuiButton-root': { marginTop: spacing.lg },
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
