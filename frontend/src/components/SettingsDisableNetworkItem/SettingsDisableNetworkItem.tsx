import React from 'react'
import { useSelector } from 'react-redux'
import { makeStyles } from '@mui/styles'
import { ApplicationState } from '../../store'
import { ListItemSetting } from '../ListItemSetting'
import { emit } from '../../services/Controller'

export const SettingsDisableNetworkItem: React.FC = () => {
  const css = useStyles()
  const { preferences } = useSelector((state: ApplicationState) => state.backend)
  const [toggleChange, setToggleChange] = React.useState(false)
  const subLabelText = toggleChange ? (
    <span className={css.span}>Please restart for changes to take effect.</span>
  ) : (
    'This will allow network access to the desktop UI on ports 29999 and 29998 in addition to sharing through remote.it'
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

const useStyles = makeStyles(({ palette }) => ({
  span: { color: palette.warning.main },
}))
