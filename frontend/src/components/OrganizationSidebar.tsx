import React from 'react'
import { makeStyles, Box } from '@material-ui/core'
import { ORGANIZATION_BAR_WIDTH } from '../shared/constants'
import { isElectron, isMac } from '../services/Browser'
import { OrganizationSelect } from './OrganizationSelect'
import { spacing } from '../styling'

export const OrganizationSidebar: React.FC = ({ children }) => {
  const css = useStyles({ addSpace: isMac() && isElectron() })

  return (
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
    overflow: 'hidden',
    contain: 'layout',
  },
  organizationBar: ({ addSpace }: { addSpace: boolean }) => ({
    backgroundColor: palette.grayLighter.main,
    display: 'flex',
    flexDirection: 'column',
    width: ORGANIZATION_BAR_WIDTH,
    minWidth: ORGANIZATION_BAR_WIDTH,
    maxWidth: ORGANIZATION_BAR_WIDTH,
    borderRight: `1px solid ${palette.grayLight.main}`,
    paddingTop: addSpace ? spacing.xl : spacing.md,
  }),
}))
