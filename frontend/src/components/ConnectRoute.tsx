import React from 'react'
import { Box, Button, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material'
import { CopyIconButton } from '../buttons/CopyIconButton'
import { Icon } from './Icon'

export type ConnectRouteVariant = 'primary' | 'option'

type Props = {
  variant: ConnectRouteVariant
  icon: string
  label: string // what the button does: "Open in browser"
  how: React.ReactNode // one line: where it opens, or how it gets there
  address?: string // what is copied
  copyTitle?: string
  onClick?: () => void
  loading?: boolean
  disabled?: boolean
  button?: React.ReactNode // a button of its own in place of the plain one (the public route's Connect)
  error?: React.ReactNode
  details?: React.ReactNode // primary only: the route's own controls, under its line
  children?: React.ReactNode // dialogs the action opens, in either variant
}

/** One way to connect to a service, as the service page shows it: the primary one as a large button with its line and
 *  address beside it, the others as rows under "More ways to connect". */
export const ConnectRoute: React.FC<Props> = ({
  variant,
  icon,
  label,
  how,
  address,
  copyTitle,
  onClick,
  loading,
  disabled,
  button,
  error,
  details,
  children,
}) => {
  const copy = address ? <CopyIconButton value={address} title={copyTitle} color="primary" size="md" /> : undefined

  if (variant === 'option')
    return (
      <>
        <ListItem
          disablePadding
          secondaryAction={copy}
          sx={{
            marginY: 0,
            paddingRight: copy ? 6 : 0,
            '& .MuiListItemButton-root': { paddingLeft: 2, paddingRight: 2, marginY: 0 },
          }}
        >
          {button ? (
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', paddingY: 0.75, paddingX: 2 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Icon name={icon} color="primary" size="md" fixedWidth />
              </ListItemIcon>
              <ListItemText
                primary={label}
                primaryTypographyProps={{ fontWeight: 500 }}
                secondary={
                  <>
                    {how}
                    {error && (
                      <Typography component="span" variant="caption" color="error" display="block">
                        {error}
                      </Typography>
                    )}
                  </>
                }
                secondaryTypographyProps={{ component: 'div' }}
                sx={{ flex: 1, marginRight: 2 }}
              />
              <Box sx={{ flexShrink: 0 }}>{button}</Box>
            </Box>
          ) : (
            <ListItemButton
              onClick={onClick}
              disabled={disabled || loading}
              data-testid="launch"
              sx={{ borderRadius: 1, paddingY: 0.75 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Icon name={loading ? 'spinner-third' : icon} spin={loading} color="primary" size="md" fixedWidth />
              </ListItemIcon>
              <ListItemText
                primary={label}
                primaryTypographyProps={{ color: 'primary', fontWeight: 500 }}
                secondary={
                  <>
                    {how}
                    {error && (
                      <Typography component="span" variant="caption" color="error" display="block">
                        {error}
                      </Typography>
                    )}
                  </>
                }
                secondaryTypographyProps={{ component: 'div' }}
              />
            </ListItemButton>
          )}
        </ListItem>
        {children}
      </>
    )

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'center' },
        gap: { xs: 1.5, sm: 2.5 },
      }}
    >
      <Box sx={{ flexShrink: 0, minWidth: { sm: 220 }, display: 'flex' }}>
        {button || (
          <Button
            variant="contained"
            size="large"
            color="primary"
            disableElevation
            onClick={onClick}
            disabled={disabled || loading}
            data-testid="launch"
            startIcon={<Icon name={loading ? 'spinner-third' : icon} spin={loading} type="solid" />}
            sx={{ height: 48, paddingX: 3, flexGrow: 1 }}
          >
            {label}
          </Button>
        )}
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="body2" color="textSecondary">
          {how}
        </Typography>
        {address && (
          <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0, marginLeft: -0.5 }}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 500, minWidth: 0, paddingLeft: 0.5 }}
              noWrap
              title={address}
              data-testid="route-address"
            >
              {address}
            </Typography>
            {copy}
          </Box>
        )}
        {error && (
          <Typography variant="caption" color="error" component="div">
            {error}
          </Typography>
        )}
        {details}
      </Box>
      {children}
    </Box>
  )
}
