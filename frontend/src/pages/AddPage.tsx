import React from 'react'
import { useParams } from 'react-router-dom'
import { makeStyles, Box } from '@material-ui/core'
import { AddDesktop } from '../components/AddDesktop'
import { AddDevice } from '../components/AddDevice'
import { Body } from '../components/Body'
import { Icon } from '../components/Icon'
import { spacing } from '../styling'

export const AddPage: React.FC = () => {
  let { platform = '' } = useParams<{ platform?: string }>()
  const css = useStyles()

  return (
    <Body center>
      <Box display="flex" paddingBottom={5}>
        <Box className={css.icon}>
          <Icon name={platform} fontSize={100} platformIcon />
        </Box>
        <Box className={css.box}>
          {['windows', 'apple'].includes(platform) ? <AddDesktop /> : <AddDevice platformName={platform} />}
        </Box>
      </Box>
    </Body>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  icon: {
    marginTop: spacing.xl,
  },
  box: {
    borderLeft: `1px solid ${palette.divider}`,
    marginLeft: spacing.xl,
    paddingLeft: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    '& section': { marginTop: spacing.lg, marginBottom: spacing.lg },
    '& .MuiIconButton-root': { minHeight: '3em', minWidth: 600, maxWidth: 600 },
  },
}))
