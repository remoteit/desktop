import React, { useState } from 'react'
import { makeStyles } from '@mui/styles'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { Stack, ListItemIcon, Box } from '@mui/material'
import { AddPlatformServices } from './AddPlatformServices'
import { selectPermissions } from '../selectors/organizations'
import { AddDevice } from './AddDevice'
import { platforms } from '../platforms'
import { spacing } from '../styling'
import { Icon } from './Icon'

export const AddPlatform: React.FC = () => {
  const platform = 'linux'
  const platformObj = platforms.get(platform)
  const defaultServices = platformObj.services ? platformObj.services.map(s => s.application) : [28]
  const permissions = useSelector((state: ApplicationState) => selectPermissions(state))
  const [applicationTypes, setApplicationTypes] = useState<number[]>(defaultServices)
  const css = useStyles()

  return (
    <Stack flexWrap={{ xs: 'wrap', md: 'nowrap' }} width="100%" flexDirection="row">
      <Box className={css.icon}>
        <ListItemIcon>
          <Icon name={platform} size="xxl" platformIcon fixedWidth />
        </ListItemIcon>
        {permissions?.includes('MANAGE') && (
          <AddPlatformServices types={applicationTypes} onChange={type => setApplicationTypes(type)} />
        )}
      </Box>
      <Box className={css.box}>
        <AddDevice platform={platformObj} types={applicationTypes} minimal />
      </Box>
    </Stack>
  )
}

const useStyles = makeStyles({
  icon: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    maxWidth: 130,
    marginTop: spacing.md,
    paddingRight: spacing.lg,
  },
  box: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    minWidth: 200,
    flexGrow: 1,
    '& .MuiAvatar-root': { marginTop: spacing.xxs },
    '& .MuiTypography-body2': { marginBottom: spacing.xs },
  },
})
