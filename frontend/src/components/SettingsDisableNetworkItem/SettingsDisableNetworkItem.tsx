import React from 'react'
import { useSelector } from 'react-redux'
import { Box } from '@mui/material'
import { State } from '../../store'
import { ListItemSetting } from '../ListItemSetting'
import { emit } from '../../services/Controller'

export const SettingsDisableNetworkItem: React.FC = () => {
  const { preferences } = useSelector((state: State) => state.backend)
  const [toggleChange, setToggleChange] = React.useState(false)
  const subLabelText = toggleChange ? (
    <Box component="span" sx={{ color: 'warning.main' }}>
      Please restart for changes to take effect.
    </Box>
  ) : (
    'This will allow network access to the desktop UI on ports 29999 and 29998 in addition to sharing through Remote.It'
  )

  if (!preferences) return null

  const handleClick = () => {
    setToggleChange(!toggleChange)
    emit('preferences', { ...preferences, disableLocalNetwork: !preferences.disableLocalNetwork })
  }

  return (
    <ListItemSetting
      label="Enable local network discovery"
      subLabel={subLabelText}
      icon={preferences.disableLocalNetwork ? 'wifi-slash' : 'wifi'}
      toggle={!preferences.disableLocalNetwork}
      onClick={handleClick}
    />
  )
}
