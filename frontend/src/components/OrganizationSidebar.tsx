import React from 'react'
import { Box } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { ORGANIZATION_BAR_WIDTH } from '../shared/constants'
import { isElectron, isMac } from '../services/Browser'
import { OrganizationSelect } from './OrganizationSelect'
import { spacing } from '../styling'

type Props = { hide?: boolean; insets: ILayout['insets']; children?: React.ReactNode }

export const OrganizationSidebar: React.FC<Props> = ({ hide, insets, children }) => {
  const css = useStyles({ addSpace: isMac() && isElectron(), insets })

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

type StyleProps = {
  addSpace: boolean
  insets: ILayout['insets']
}

const useStyles = makeStyles(({ palette }) => ({
  container: {
    display: 'flex',
    height: '100%',
    contain: 'layout',
  },
  organizationBar: ({ insets, addSpace }: StyleProps) => ({
    backgroundColor: palette.grayLighter.main,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: ORGANIZATION_BAR_WIDTH,
    minWidth: ORGANIZATION_BAR_WIDTH,
    maxWidth: ORGANIZATION_BAR_WIDTH,
    borderRight: `1px solid ${palette.grayLight.main}`,
    position: 'relative',
    overflow: 'hidden',
    // for iOS mobile
    paddingTop: insets.top || (addSpace ? spacing.xl : spacing.md),
    paddingBottom: insets.bottom,
  }),
}))
