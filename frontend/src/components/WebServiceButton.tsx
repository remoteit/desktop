import React from 'react'
import { useTranslation } from 'react-i18next'
import { IconButton } from '../buttons/IconButton'
import type { WebTarget } from '../services/webAddress'
import { useOpenWebService } from '../hooks/useWebAddress'

// Opens a web service from its row in a list (services/webAddress openWebService).
export const WebServiceButton: React.FC<{ target: WebTarget }> = ({ target }) => {
  const { t } = useTranslation()
  const { open, opening } = useOpenWebService(target)

  return (
    <IconButton
      icon={opening ? 'spinner-third' : 'launch'}
      spin={opening}
      color="primary"
      size="sm"
      buttonBaseSize="small"
      disabled={opening}
      title={t('webAddress.open', 'Open in the browser')}
      onClick={event => {
        // The row opens the service's page: the button is not the row.
        event.preventDefault()
        event.stopPropagation()
        open()
      }}
    />
  )
}
