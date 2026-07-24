import React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import { Box, Typography, IconButton } from '@mui/material'
import { State, Dispatch } from '../store'
import { Icon } from './Icon'

export const ViewAsBanner: React.FC = () => {
  const { t } = useTranslation()
  const viewAsUser = useSelector((state: State) => state.ui.viewAsUser)
  const dispatch = useDispatch<Dispatch>()

  if (!viewAsUser) return null

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
        {t('viewAsBanner.viewingAs', { email: viewAsUser.email, defaultValue: 'Viewing as: {{email}}' })}
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
