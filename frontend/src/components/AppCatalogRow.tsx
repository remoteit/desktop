import React from 'react'
import { useTranslation } from 'react-i18next'
import { Box, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material'
import { appIcon, capabilitiesLine } from '../helpers/appsHelper'
import { Icon } from './Icon'

/* One app in the catalogue (presence-server docs/device-apps-design.md, "The Apps pages"): its name, its publisher with
   Verified: <domain> and Yours for the account's own, Runs as root or Restricted and what else it asks of remote.it
   (its capabilities, in words), its icon from how its service opens, its description, its platforms and
   what is said beside them (how many devices have it, or why this device cannot take it). The row opens the app;
   its action (Add…) sits at its end. */
export type AppCatalogRowProps = {
  id: string
  name: string
  publisher: string
  verifiedDomain?: string | null
  own?: boolean // the account's own publisher
  root: boolean
  capabilities?: string[]
  protocol?: string | null // how its service opens: its icon
  description?: string | null
  platforms?: string | null // as families
  aside?: React.ReactNode // beside the platforms: how many devices have it
  notes?: React.ReactNode // under it: why it cannot be added, a remote.it too old
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
  description,
  platforms,
  aside,
  notes,
  action,
  onOpen,
}) => {
  const { t } = useTranslation()
  const body = (
    <>
      <ListItemIcon sx={{ alignSelf: 'flex-start', marginTop: 0.5 }}>
        <Icon name={appIcon(protocol)} size="md" fixedWidth />
      </ListItemIcon>
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'baseline', flexWrap: 'wrap' }}>
            <span>{name}</span>
            <Typography variant="caption" color="textSecondary" data-catalog-publisher>
              {[
                publisher,
                verifiedDomain && t('deviceApps.verified', 'Verified: {{domain}}', { domain: verifiedDomain }),
                own && t('apps.yours', 'Yours'),
              ]
                .filter(Boolean)
                .join(' · ')}
            </Typography>
            <Typography variant="caption" color={root ? 'warning.main' : 'textSecondary'} data-catalog-runs>
              {root
                ? t('apps.runsAsRootFull', 'Runs as root: full control of the device')
                : t('apps.restricted', 'Restricted')}
            </Typography>
            {!!capabilities?.length && (
              <Typography variant="caption" color="textSecondary" data-catalog-capabilities>
                {capabilitiesLine(t, capabilities)}
              </Typography>
            )}
          </Box>
        }
        secondaryTypographyProps={{ component: 'div' }}
        secondary={
          <>
            {description && (
              <Typography variant="caption" component="div" color="textSecondary" data-catalog-description>
                {description}
              </Typography>
            )}
            {(platforms || aside) && (
              <Box sx={{ display: 'flex', gap: 3 }}>
                {platforms && (
                  <Typography variant="caption" color="textSecondary" data-catalog-platforms>
                    {platforms}
                  </Typography>
                )}
                {aside && (
                  <Typography variant="caption" color="textSecondary" data-catalog-aside>
                    {aside}
                  </Typography>
                )}
              </Box>
            )}
            {notes}
          </>
        }
      />
    </>
  )
  return (
    <ListItem disablePadding data-catalog-app={id} secondaryAction={action}>
      {onOpen ? (
        <ListItemButton onClick={onOpen} sx={{ paddingRight: action ? '120px !important' : undefined }}>
          {body}
        </ListItemButton>
      ) : (
        <Box sx={{ display: 'flex', width: '100%', paddingX: 2, paddingY: 0.5 }}>{body}</Box>
      )}
    </ListItem>
  )
}
