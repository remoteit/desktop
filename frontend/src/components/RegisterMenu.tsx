import React from 'react'
import { useTranslation } from 'react-i18next'
import { GUIDE_START_DATE } from '../constants'
import { State } from '../store'
import { useLocation } from 'react-router-dom'
import { IconButton, ButtonProps } from '../buttons/IconButton'
import { selectCanRegister } from '../selectors/organizations'
import { selectDeviceModelAttributes } from '../selectors/devices'
import { Typography, Paper } from '@mui/material'
import { useSelector } from 'react-redux'
import { GuideBubble } from './GuideBubble'
import { spacing } from '../styling'

type Props = ButtonProps & { fab?: boolean; buttonSize: number; sidebar?: boolean }

// The sidebar's width less its gutters: the tip stays inside it, clear of every page's title.
const SIDEBAR_TIP_WIDTH = 214

/** The "Add a device" tip is for an account with nothing in it yet, read once its list is known. */
export const showsAddDeviceTip = (devices: { initialized: boolean; total: number }) =>
  devices.initialized && devices.total === 0

export const RegisterMenu: React.FC<Props> = ({ fab, buttonSize = 38, sidebar, ...props }) => {
  const { t } = useTranslation()
  const location = useLocation()
  const layout = useSelector((state: State) => state.ui.layout)
  const unauthorized = !useSelector(selectCanRegister)
  const disabled = unauthorized || location.pathname === '/add'
  const empty = useSelector((state: State) => showsAddDeviceTip(selectDeviceModelAttributes(state)))

  // The sidebar button stays visible but disabled, so the tooltip can explain the
  // missing permission. The mobile FAB does not: it is a floating primary action
  // over page content, and a permanently inert one is just an obstacle - on mobile
  // the disabled button is still reachable in the drawer.
  if (fab && (unauthorized || !layout.hideSidebar)) return null

  const button = (
    <GuideBubble
      sidebar={sidebar}
      guide="addDevice"
      placement={sidebar ? 'bottom-end' : 'top-end'}
      width={sidebar ? SIDEBAR_TIP_WIDTH : undefined}
      startDate={GUIDE_START_DATE}
      added={GUIDE_START_DATE}
      enterDelay={400}
      hide={disabled || !empty}
      instructions={
        <>
          <Typography variant="h3" gutterBottom>
            <b>{t('registerMenu.guideTitle', 'Add a device')}</b>
          </Typography>
          <Typography variant="body2" gutterBottom>
            {t('registerMenu.guideInstall', 'Install the Remote.It agent on a device you want to reach.')}
          </Typography>
          <Typography variant="body2" gutterBottom>
            {t('registerMenu.guideAppears', 'It shows up in Devices once it is online.')}
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
        label={t('registerMenu.addDevice', 'Add device')}
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
        bgcolor: 'primary.main',
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
