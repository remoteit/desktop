import React from 'react'
import { useTranslation } from 'react-i18next'
import { GUIDE_START_DATE } from '../constants'
import { State } from '../store'
import { useLocation } from 'react-router-dom'
import { IconButton, ButtonProps } from '../buttons/IconButton'
import { selectCanRegister } from '../selectors/organizations'
import { Typography, Paper } from '@mui/material'
import { useSelector } from 'react-redux'
import { GuideBubble } from './GuideBubble'
import { spacing } from '../styling'

type Props = ButtonProps & { fab?: boolean; buttonSize: number; sidebar?: boolean }

export const RegisterMenu: React.FC<Props> = ({ fab, buttonSize = 38, sidebar, ...props }) => {
  const { t } = useTranslation()
  const location = useLocation()
  const layout = useSelector((state: State) => state.ui.layout)
  const unauthorized = !useSelector(selectCanRegister)
  const disabled = unauthorized || location.pathname === '/add'

  if (fab && !layout.hideSidebar) return null

  const button = (
    <GuideBubble
      sidebar={sidebar}
      guide="addDevice"
      placement="bottom"
      startDate={GUIDE_START_DATE}
      added={GUIDE_START_DATE}
      enterDelay={400}
      hide={disabled}
      instructions={
        <>
          <Typography variant="h3" gutterBottom>
            <b>{t('registerMenu.guideTitle', 'Add a device')}</b>
          </Typography>
          <Typography variant="body2" gutterBottom>
            {t(
              'registerMenu.guideInstallAgent',
              'First step is to install our agent on any device you would like to connect to.'
            )}
          </Typography>
          <Typography variant="body2" gutterBottom>
            {t('registerMenu.guideRegistersBefore', 'Your device will automatically register and appear on the')}{' '}
            <cite>{t('registerMenu.guideDevices', 'devices')}</cite>{' '}
            {t('registerMenu.guideRegistersAfter', 'page.')}
          </Typography>
        </>
      }
    >
      <IconButton
        {...props}
        sx={{
          borderRadius: '50%',
          width: buttonSize,
          height: buttonSize,
          // Without register permission the button stays visible but reads as
          // inert - a grey plus on the surface colour instead of white on blue.
          // MUI's own .Mui-disabled rule is more specific than sx, so the
          // disabled state has to be restated to win.
          ...(unauthorized && {
            backgroundColor: 'white.main',
            color: 'gray.main',
            '&:hover': { backgroundColor: 'white.main' },
            '&.Mui-disabled': { backgroundColor: 'white.main', color: 'gray.main' },
          }),
        }}
        title={
          unauthorized
            ? t(
                'registerMenu.managePermissionRequired',
                'Manage permission required to add a device to this organization.'
              )
            : t('registerMenu.addDevice', 'Add device')
        }
        to="/add"
        forceTitle
        hideDisableFade
        variant="contained"
        disabled={disabled}
        color="primary"
        icon="plus"
      />
    </GuideBubble>
  )

  return fab ? (
    <Paper
      elevation={0}
      sx={{
        borderWidth: 3,
        borderStyle: 'solid',
        borderColor: 'white.main',
        borderRadius: '50%',
        position: 'absolute',
        bgcolor: unauthorized ? 'white.main' : 'primary.main',
        bottom: layout.mobile ? spacing.sm : spacing.xl,
        right: spacing.xl,
        zIndex: 10,
      }}
    >
      {button}
    </Paper>
  ) : (
    button
  )
}
