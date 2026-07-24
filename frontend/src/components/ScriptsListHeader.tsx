import React from 'react'
import { useHistory } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Box, Button, Typography, Tooltip, useMediaQuery } from '@mui/material'
import { useTranslation } from 'react-i18next'
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
  const dispatch = useDispatch<Dispatch>()
  const sidebarHidden = useMediaQuery(`(max-width:${HIDE_SIDEBAR_WIDTH}px)`)
  const permissions = useSelector(selectPermissions)
  const { t } = useTranslation()

  const title = scripts ? t('scriptsListHeader.scripts', 'Scripts') : t('scriptsListHeader.files', 'Files')
  const addPath = scripts ? '/scripts/add' : '/files/add'
  const addLabel = scripts ? t('scriptsListHeader.add', 'Add') : t('scriptsListHeader.upload', 'Upload')

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 45,
        paddingLeft: `${spacing.md}px`,
        paddingRight: `${spacing.md}px`,
        marginTop: `${spacing.sm}px`,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
            title={t('scriptsListHeader.back', 'Back')}
            onClick={onBack}
            size="md"
          />
        )}
        <RefreshButton size="md" color="grayDarker" />
        {sidebarHidden && (
          <Typography variant="h2">
            <Title>{title}</Title>
          </Typography>
        )}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Tooltip
          title={permissions.includes('ADMIN') ? '' : t('scriptsListHeader.adminRequired', 'Admin permissions required')}
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
