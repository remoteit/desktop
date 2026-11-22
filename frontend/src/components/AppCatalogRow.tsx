import React from 'react'
import { AppIcon } from './AppIcon'
import { useTranslation } from 'react-i18next'
import { Box, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, useMediaQuery, useTheme } from '@mui/material'
import { appName, appPurpose, capabilitiesLine, needsLine } from '../helpers/appsHelper'

/* One app in the catalogue (presence-server docs/device-apps-design.md, "The Apps pages"): what it does first (its
   description, else a line from its name and how it opens), then where it runs and what it needs (full control where
   it runs as root, and its capabilities), then its publisher with Verified: <domain> and Yours for the account's own.
   The row opens the app; its action sits at its end. */
export type AppCatalogRowProps = {
  id: string
  name: string
  publisher: string
  verifiedDomain?: string | null
  own?: boolean // the account's own publisher
  root: boolean
  capabilities?: string[]
  protocol?: string | null // how its service opens: its icon where it has none of its own
  icon?: string | null // its own icon's URL (components/AppIcon)
  description?: string | null
  platforms?: string | null // as families
  aside?: React.ReactNode // beside the platforms: how many devices have it, or the version offered
  notes?: React.ReactNode // under it: why it cannot be added, an agent too old
  action?: React.ReactNode
  onOpen?: () => void
}

export const AppCatalogRow: React.FC<AppCatalogRowProps> = ({
  id,
  name,
  publisher,
  verifiedDomain,
  own,
  root,
  capabilities,
  protocol,
  icon,
  description,
  platforms,
  aside,
  notes,
  action,
  onOpen,
}) => {
  const { t } = useTranslation()
  const needs = needsLine(t, root)
  // On a phone the action sits under the words, which would otherwise wrap a few to a line beside it.
  const narrow = useMediaQuery(useTheme().breakpoints.down('sm'))
  const beside = narrow ? undefined : action
  const facts = (
    <Box sx={{ display: 'flex', columnGap: 1.5, rowGap: 0, flexWrap: 'wrap' }}>
      {platforms && (
        <Typography variant="caption" color="textSecondary" data-catalog-platforms>
          {platforms}
        </Typography>
      )}
      {needs && (
        <Typography variant="caption" color="warning.main" data-catalog-runs>
          {needs}
        </Typography>
      )}
      {aside && (
        <Typography variant="caption" color="textSecondary" data-catalog-aside>
          {aside}
        </Typography>
      )}
    </Box>
  )
  const body = (
    <>
      <ListItemIcon sx={{ alignSelf: 'flex-start', marginTop: 0.75 }}>
        <AppIcon icon={icon} protocol={protocol} size="lg" />
      </ListItemIcon>
      <ListItemText
        primary={
          <Typography component="span" variant="body1" fontWeight={500}>
            {appName(t, { id, name })}
          </Typography>
        }
        secondaryTypographyProps={{ component: 'div' }}
        secondary={
          <>
            <Typography
              variant="body2"
              component="div"
              color="grayDarkest.main"
              sx={{ marginY: 0.25 }}
              data-catalog-description
            >
              {appPurpose(t, { id, name, description, protocol })}
            </Typography>
            {facts}
            {!!capabilities?.length && (
              <Typography variant="caption" component="div" color="textSecondary" data-catalog-capabilities>
                {capabilitiesLine(t, capabilities)}
              </Typography>
            )}
            <Typography variant="caption" component="div" color="gray.main" data-catalog-publisher>
              {[
                t('deviceApps.publisher', 'By {{publisher}}', { publisher }),
                verifiedDomain && t('deviceApps.verified', 'Verified: {{domain}}', { domain: verifiedDomain }),
                own && t('apps.yours', 'Yours'),
              ]
                .filter(Boolean)
                .join(' · ')}
            </Typography>
            {notes}
            {narrow && action && (
              <Box sx={{ marginTop: 1 }} onClick={event => event.stopPropagation()}>
                {action}
              </Box>
            )}
          </>
        }
      />
    </>
  )
  return (
    <ListItem disablePadding data-catalog-app={id} secondaryAction={beside} sx={{ alignItems: 'flex-start' }}>
      {onOpen ? (
        <ListItemButton
          disableGutters
          onClick={onOpen}
          sx={{ alignItems: 'flex-start', paddingY: 1, paddingRight: beside ? '140px !important' : undefined }}
        >
          {body}
        </ListItemButton>
      ) : (
        <Box sx={{ display: 'flex', width: '100%', paddingY: 1 }}>{body}</Box>
      )}
    </ListItem>
  )
}
