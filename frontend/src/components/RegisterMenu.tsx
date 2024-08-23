import React from 'react'
import { State } from '../store'
import { useLocation } from 'react-router-dom'
import { IconButton, ButtonProps } from '../buttons/IconButton'
import { selectPermissions } from '../selectors/organizations'
import { Typography, Paper } from '@mui/material'
import { useSelector } from 'react-redux'
import { GuideBubble } from './GuideBubble'
import { spacing } from '../styling'

type Props = ButtonProps & { fab?: boolean; buttonSize: number; sidebar?: boolean }

export const RegisterMenu: React.FC<Props> = ({ fab, buttonSize = 38, sidebar, ...props }) => {
  const location = useLocation()
  const layout = useSelector((state: State) => state.ui.layout)
  const permissions = useSelector(selectPermissions)
  const unauthorized = !permissions.includes('MANAGE')
  const disabled = unauthorized || location.pathname === '/add'

  if (unauthorized || (fab && !layout.hideSidebar)) return null

  const button = (
    <GuideBubble
      sidebar={sidebar}
      guide="addDevice"
      placement="bottom"
      startDate={new Date('2022-09-20')}
      enterDelay={400}
      hide={disabled}
      instructions={
        <>
          <Typography variant="h3" gutterBottom>
            <b>Add a device</b>
          </Typography>
          <Typography variant="body2" gutterBottom>
            First step is to install our agent on any device you would like to connect to.
          </Typography>
          <Typography variant="body2" gutterBottom>
            Your device will automatically register and appear on the <cite>devices</cite> page.
          </Typography>
        </>
      }
    >
      <IconButton
        {...props}
        sx={{ borderRadius: '50%', width: buttonSize, height: buttonSize }}
        title={
          unauthorized ? (
            <>
              Register permission required to <br />
              add a device to this organization.
            </>
          ) : (
            'Add device'
          )
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
