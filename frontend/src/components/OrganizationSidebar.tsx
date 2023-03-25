import React from 'react'
import { Box } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { ORGANIZATION_BAR_WIDTH } from '../shared/constants'
import { isElectron, isMac } from '../services/Browser'
import { OrganizationSelect } from './OrganizationSelect'
import { getActiveUser } from '../selectors/accounts'
import { createColor } from '../helpers/uiHelper'
import { labelLookup } from '../models/labels'
import { spacing } from '../styling'

export const OrganizationSidebar: React.FC<{ hide?: boolean; children?: React.ReactNode }> = ({ hide, children }) => {
  const { color } = useSelector((state: ApplicationState) => {
    const activeOrg = getActiveUser(state)
    return labelLookup[createColor(activeOrg.email)]
  })
  const css = useStyles({ addSpace: isMac() && isElectron(), color })

  return hide ? (
    <>{children}</>
  ) : (
    <Box className={css.container}>
      <Box className={css.organizationBar}>
        <OrganizationSelect />
      </Box>
      {children}
    </Box>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  container: {
    display: 'flex',
    height: '100%',
    contain: 'layout',
  },
  organizationBar: ({ addSpace, color }: { addSpace: boolean; color: string }) => ({
    backgroundColor: /* color || */ palette.grayLighter.main,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: ORGANIZATION_BAR_WIDTH,
    minWidth: ORGANIZATION_BAR_WIDTH,
    maxWidth: ORGANIZATION_BAR_WIDTH,
    borderRight: `1px solid ${palette.grayLight.main}`,
    paddingTop: addSpace ? spacing.xl : spacing.md,
    position: 'relative',
    overflow: 'hidden',
  }),
}))
