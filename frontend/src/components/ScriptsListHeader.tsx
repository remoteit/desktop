import React from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Box, Button, Typography, Tooltip, useMediaQuery } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { selectPermissions } from '../selectors/organizations'
import { IconButton } from '../buttons/IconButton'
import { RefreshButton } from '../buttons/RefreshButton'
import { Icon } from '../components/Icon'
import { Title } from '../components/Title'
import { spacing } from '../styling'
import { HIDE_SIDEBAR_WIDTH } from '../constants'
import { Dispatch } from '../store'

type Props = {
  showBack?: boolean
  onBack?: () => void
  scripts?: boolean
}

export const ScriptsListHeader: React.FC<Props> = ({ showBack, onBack, scripts }) => {
  const history = useHistory()
  const location = useLocation()
  const dispatch = useDispatch<Dispatch>()
  const css = useStyles()
  const sidebarHidden = useMediaQuery(`(max-width:${HIDE_SIDEBAR_WIDTH}px)`)
  const permissions = useSelector(selectPermissions)

  const title = scripts ? 'Scripts' : 'Files'
  const addPath = scripts ? '/scripts/add' : '/files/add'
  const addLabel = scripts ? 'Add' : 'Upload'

  return (
    <Box className={css.header}>
      <Box className={css.left}>
        {sidebarHidden && (
          <IconButton
            name="bars"
            size="md"
            color="grayDarker"
            onClick={() => dispatch.ui.set({ sidebarMenu: true })}
          />
        )}
        {showBack && (
          <IconButton
            icon="chevron-left"
            title="Back"
            onClick={onBack}
            size="md"
          />
        )}
        <RefreshButton size="md" color="grayDarker" />
        {sidebarHidden && (
          <Typography variant="h2" className={css.title}>
            <Title>{title}</Title>
          </Typography>
        )}
      </Box>
      <Box className={css.right}>
        <Tooltip
          title={permissions.includes('ADMIN') ? '' : 'Admin permissions required'}
          placement="top"
          arrow
        >
          <span>
            <Button
              size="small"
              variant="contained"
              color="primary"
              disabled={!permissions.includes('ADMIN')}
              onClick={() => history.push(addPath)}
              startIcon={<Icon name="plus" />}
            >
              {addLabel}
            </Button>
          </span>
        </Tooltip>
      </Box>
    </Box>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 45,
    paddingLeft: spacing.md,
    paddingRight: spacing.md,
    marginTop: spacing.sm,
  },
  left: {
    display: 'flex',
    alignItems: 'center',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
  },
  title: {},
}))
