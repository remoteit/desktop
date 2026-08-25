import React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import { Box, Typography, IconButton } from '@mui/material'
import { State, Dispatch } from '../store'
import { Icon } from './Icon'
import { oidcActor } from '../services/oidc'

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
  if (!viewAsUser && !supportSession) return null
  const email = viewAsUser?.email || user?.email || ''

  const handleExit = () => {
    // Clear from sessionStorage
    window.sessionStorage.removeItem('viewAsUser')
    // Clear from Redux state
    dispatch.ui.set({ viewAsUser: null })
    // Close the window/tab
    window.close()
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
          ? t('viewAsBanner.supportSession', { email, defaultValue: 'Support session — viewing as {{email}}. Tokens are stamped with your identity; the user can see and end this session.' })
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
