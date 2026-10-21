import React from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { State } from '../store'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { Link } from './Link'
import { IconButton } from '../buttons/IconButton'

type Props = {
  allowScanning?: boolean
  // Ask the device what it sees (a device-session device the user manages), in place of scanning from this machine.
  discover?: boolean
  button?: boolean
}

export const AddFromNetwork: React.FC<Props> = ({ allowScanning, discover, button }) => {
  const { deviceID } = useParams<{ deviceID: string }>()
  const { scanEnabled } = useSelector((state: State) => state.ui)
  const history = useHistory()
  const { t } = useTranslation()

  if (discover)
    return button ? (
      <IconButton
        icon="radar"
        size="md"
        title={t('addFromNetwork.discover', 'What this device sees')}
        onClick={() => history.push(`/devices/${deviceID}/add/discover`)}
      />
    ) : (
      <Link to={`/devices/${deviceID}/add/discover`}>{t('addFromNetwork.discover', 'What this device sees')}</Link>
    )

  if (!allowScanning || !scanEnabled) return null

  return button ? (
    <IconButton
      icon="radar"
      size="md"
      title={t('addFromNetwork.scanForServices', 'Scan for Services')}
      onClick={() => history.push(`/devices/${deviceID}/add/scan`)}
    />
  ) : (
    <Link to={`/devices/${deviceID}/add/scan`}>{t('addFromNetwork.scanNetwork', 'Scan network')}</Link>
  )
}
