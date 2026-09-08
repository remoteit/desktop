import React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import { Box, Typography, IconButton } from '@mui/material'
import { State, Dispatch } from '../store'
import { Icon } from './Icon'
import { oidcActor, oidcSupportEndsAt, oidcClearLocal } from '../services/oidc'
import { OAUTH_ISSUER } from '../constants'

export const ViewAsBanner: React.FC = () => {
  const { t } = useTranslation()
  const viewAsUser = useSelector((state: State) => state.ui.viewAsUser)
  const user = useSelector((state: State) => state.auth.user)
  const dispatch = useDispatch<Dispatch>()

  // Two lanes light this banner. The legacy header lane sets ui.viewAsUser. A SUPPORT
  // SESSION (permitteer impersonation) needs no app state at all: the id_token itself says
  // the identity is acted (`act` names the operator), so the banner reads the token — the
  // one signal that cannot drift from what the session actually is.
  const actor = oidcActor()
  const supportSession = !viewAsUser && !!actor && !!user
  // The session's end is the token's expiry (permitteer docs/desktop-support.md): shown so the
  // operator knows how long the view lasts — nothing renews it.
  const endsAt = oidcSupportEndsAt()
  const until = endsAt ? new Date(endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
  if (!viewAsUser && !supportSession) return null
  const email = viewAsUser?.email || user?.email || ''

  const handleExit = () => {
    // Clear from sessionStorage
    window.sessionStorage.removeItem('viewAsUser')
    // Clear from Redux state
    dispatch.ui.set({ viewAsUser: null })
    // Close the window/tab. Only a script-opened window may close itself — after a step-up on
    // the way in, the console's OWN tab became the support session (the popup had no click behind
    // it), so close() is a no-op there. Then: end this tab's support state and go back to the
    // console, which is where the operator came from (permitteer docs/desktop-support.md).
    window.close()
    window.setTimeout(() => {
      if (window.closed) return
      if (supportSession) {
        oidcClearLocal()
        try { window.sessionStorage.removeItem('oidc.support') } catch { /* nothing to clear */ }
        window.location.assign(`${OAUTH_ISSUER}/admin/console/users`)
      }
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
        {supportSession
          ? t('viewAsBanner.supportSession', { email, until, defaultValue: 'Support session — viewing as {{email}} until {{until}}. Tokens are stamped with your identity; the user can see and end this session.' })
          : t('viewAsBanner.viewingAs', { email, defaultValue: 'Viewing as: {{email}}' })}
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
