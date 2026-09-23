import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Box, Typography, IconButton } from '@mui/material'
import { State } from '../store'
import { Icon } from './Icon'
import { oidcActor, oidcSupportEndsAt, oidcEndSupportTab } from '../services/oidc'
import { OAUTH_ISSUER } from '../constants'
import { getLocale } from '../helpers/dateHelper'

/* A SUPPORT SESSION (permitteer impersonation, docs/desktop-support.md) needs no app state: the
   id_token itself says the identity is acted (`act` names the operator), so the banner reads
   the token — the one signal that cannot drift from what the session actually is. */
export const ViewAsBanner: React.FC = () => {
  const { t } = useTranslation()
  const user = useSelector((state: State) => state.auth.user)

  // Both read (and decode) the token store, so once per session rather than per render.
  const { actor, endsAt } = useMemo(() => ({ actor: oidcActor(), endsAt: oidcSupportEndsAt() }), [user])
  if (!actor || !user) return null
  // The session's end is the token's expiry: shown so the operator knows how long the view
  // lasts — nothing renews it.
  const until = endsAt ? new Date(endsAt).toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit' }) : ''

  const handleExit = () => {
    // Close the window/tab. Only a script-opened window may close itself — after a step-up on
    // the way in, the console's OWN tab became the support session (the popup had no click behind
    // it), so close() is a no-op there. Then: end this tab's support state and go back to the
    // console, which is where the operator came from.
    window.close()
    window.setTimeout(() => {
      if (window.closed) return
      oidcEndSupportTab()
      window.location.assign(`${OAUTH_ISSUER}/admin/console/users`)
    }, 150)
  }

  return (
    <Box
      sx={{
        width: '100%',
        backgroundColor: '#FFF3CD',
        color: '#856404',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: '1px solid #FFEAA7',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 500, flexGrow: 1, textAlign: 'center' }}>
        {t('viewAsBanner.supportSession', {
          email: user.email || '',
          until,
          defaultValue:
            'Support session — viewing as {{email}} until {{until}}. Tokens are stamped with your identity; the user can see and end this session.',
        })}
      </Typography>
      <IconButton
        onClick={handleExit}
        size="small"
        sx={{
          color: '#856404',
          '&:hover': {
            backgroundColor: 'rgba(133, 100, 4, 0.1)',
          },
        }}
        title={t('viewAsBanner.exit', 'Exit view-as mode')}
      >
        <Icon name="times" size="sm" />
      </IconButton>
    </Box>
  )
}
