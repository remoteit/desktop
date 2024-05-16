import React from 'react'
import browser from '../services/browser'
import classnames from 'classnames'
import { Box } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { ORGANIZATION_BAR_WIDTH } from '../constants'
import { OrganizationSelect } from './OrganizationSelect'
import { spacing } from '../styling'

type Props = { hide?: boolean; insets: ILayout['insets']; children?: React.ReactNode }

export const OrganizationSidebar: React.FC<Props> = ({ hide, insets, children }) => {
  const css = useStyles({ addSpace: browser.isMac && browser.isElectron, insets })

  return hide ? (
    <>{children}</>
  ) : (
    <Box className={classnames(css.container, 'sidebar')}>
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
  container: ({ insets }: StyleProps) => ({
    backgroundColor: palette.grayLighter.main,
    display: 'flex',
    height: '100%',
    contain: 'layout',
    // for iOS mobile
    paddingLeft: insets.left ? insets.left : undefined,
  }),
  organizationBar: ({ insets, addSpace }: StyleProps) => ({
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
    paddingTop: spacing.md + (insets.top ? insets.top : addSpace ? spacing.md : 0),
    paddingBottom: insets?.bottom,
  }),
}))
